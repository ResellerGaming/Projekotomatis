const express = require('express');
const axios   = require('axios');
const fs      = require('fs-extra');
const { v4 }  = require('uuid');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Produk & config
const produk = [
  {id:1, nama:'Pre Order Script RESMING Pterodactyl V1', harga:10000},
  {id:2, nama:'Script Website RESMING Pterodactyl V1', harga:15000},
  {id:3, nama:'Script RESMING Pterodactyl Free Up 1x', harga:20000},
  {id:4, nama:'Script RESMING Pterodactyl Free Up Full', harga:30000},
  {id:5, nama:'Reseller Script RESMING Pterodactyl', harga:50000}
];

const API_CREATE = 'https://api.resellergaming.my.id/orderkuota/createpayment';
const API_MUTASI = 'https://api.resellergaming.my.id/orderkuota/mutasiqr';
const USER_MUT   = 'ahmadi1585';
const TOKEN_MUT  = '1607316:Yl1G70Ethw6S2mHOTBsQVgiNnP9fpRcj';

// ---------- Helper session ----------
const SESS_DIR = path.join(__dirname, '../sessions');
fs.ensureDirSync(SESS_DIR);
function sessPath(sid) { return path.join(SESS_DIR, sid + '.json'); }
function getSess(sid) {
  try { return fs.readJsonSync(sessPath(sid)); }
  catch { return null; }
}
function setSess(sid, data) {
  fs.writeJsonSync(sessPath(sid), data);
}

// ---------- Routes ----------
app.get('/', (req, res) => res.sendFile(path.join(__dirname,'../views/index.html')));

app.post('/beli', async (req,res)=>{
  const id = parseInt(req.body.id_produk);
  const p  = produk.find(x=>x.id===id);
  if(!p) return res.status(400).send('Produk tidak valid');

  const admin = Math.floor(Math.random()*500)+1;
  const total = p.harga + admin;

  const codeqr = `00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214357488533903180303UMI51440014ID.CO.QRIS.WWW0215ID20254010026420303UMI5204541153033605405${total}5802ID5922TOKO%20RESMING%20OK16073166015PADANGSIDIMPUAN61052271162070703A01630431E3`;
  const {data:api} = await axios.get(API_CREATE, {params:{amount:total, codeqr}});

  if(!api.status) return res.status(500).send('Gagal buat QRIS');

  const sid = v4();
  setSess(sid, {
    idtransaksi: api.result.idtransaksi,
    nama: p.nama, harga:p.harga, admin, total,
    expired: api.result.expired,
    qris: api.result.imageqris.url,
    telegram:'', email:'',
    cek:0
  });
  res.redirect(`/struk?s=${sid}`);
});

app.get('/struk', (req,res)=>{
  const s = getSess(req.query.s);
  if(!s) return res.redirect('/');
  res.sendFile(path.join(__dirname,'../views/struk.html'));
});

app.post('/struk', (req,res)=>{
  const s = getSess(req.body.s);
  if(!s) return res.redirect('/');
  s.telegram = req.body.telegram;
  s.email    = req.body.email;
  setSess(req.body.s, s);
  res.redirect(`/cek?s=${req.body.s}`);
});

app.get('/cek', async (req,res)=>{
  const s = getSess(req.query.s);
  if(!s) return res.redirect('/');
  s.cek++;
  setSess(req.query.s, s);
  if(s.cek>3) return res.send('⚠️ Maksimal cek 3x. <a href="/">Kembali</a>');

  const {data} = await axios.get(API_MUTASI, {params:{username:USER_MUT, token:TOKEN_MUT}});
  const paid = data.status && data.result.some(m=>parseInt(m.kredit)===s.total);
  if(paid){
    setSess(req.query.s, {...s, paid:true});
    return res.sendFile(path.join(__dirname,'../views/selesai.html'));
  }
  res.send(`❌ Belum bayar. <a href="/struk?s=${req.query.s}">Kembali</a>`);
});

app.post('/batal', (req,res)=>{
  fs.removeSync(sessPath(req.body.s));
  res.redirect('/');
});

module.exports = app;