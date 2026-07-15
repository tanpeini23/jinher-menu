// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCrPvsmyPh8SIJ0sDExRFJfGAA-3kBOS5g",
  authDomain: "jinher-3a167.firebaseapp.com",
  projectId: "jinher-3a167",
  storageBucket: "jinher-3a167.firebasestorage.app",
  messagingSenderId: "4973694934",
  appId: "1:4973694934:web:aa7b28bdd253ba15ab1e77"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const FS = {
  async saveDoc(name, obj) {
    try { await setDoc(doc(db, "jinher", name), { data: JSON.stringify(obj) }); } catch(e) {}
  },
  async loadDoc(name) {
    try {
      const snap = await getDoc(doc(db, "jinher", name));
      if (snap.exists()) return JSON.parse(snap.data().data);
    } catch(e) {}
    return null;
  },
  subscribeDoc(name, callback) {
    return onSnapshot(doc(db, "jinher", name), (snap) => {
      if (snap.exists()) { try { callback(JSON.parse(snap.data().data)); } catch(e) {} }
    });
  },
  async saveStatsMonth(ym, obj) {
    try { await setDoc(doc(db, "jinher_stats", "m_"+ym), { data: JSON.stringify(obj) }); return true; } catch(e) { return false; }
  },
  async loadStatsMonth(ym) {
    try { const snap = await getDoc(doc(db, "jinher_stats", "m_"+ym)); if(snap.exists()) return JSON.parse(snap.data().data); } catch(e) {}
    return null;
  },
  async loadAllStatsMonths() {
    try {
      const snap = await getDocs(collection(db, "jinher_stats"));
      const months = {};
      snap.forEach(d => { if(d.id.startsWith("m_")) { try { months[d.id.slice(2)] = JSON.parse(d.data().data); } catch(e){} } });
      return months;
    } catch(e) { return {}; }
  },
  async saveStatsMeta(obj) {
    try { await setDoc(doc(db, "jinher_stats", "meta"), { data: JSON.stringify(obj) }); } catch(e) {}
  },
  async loadStatsMeta() {
    try { const snap = await getDoc(doc(db, "jinher_stats", "meta")); if(snap.exists()) return JSON.parse(snap.data().data); } catch(e) {}
    return null;
  },
  async saveGroups(groups) {
    try {
      await setDoc(doc(db, "jinher", "groups"), { data: JSON.stringify(groups) });
    } catch(e) {
      try { localStorage.setItem("jinher_groups", JSON.stringify(groups)); } catch(e2) {}
    }
  },
  async loadGroups() {
    try {
      const snap = await getDoc(doc(db, "jinher", "groups"));
      if (snap.exists()) return JSON.parse(snap.data().data);
    } catch(e) {}
    try {
      const v = localStorage.getItem("jinher_groups");
      if (v) return JSON.parse(v);
    } catch(e) {}
    return null;
  },
  subscribeGroups(callback) {
    return onSnapshot(doc(db, "jinher", "groups"), (snap) => {
      if (snap.exists()) {
        try {
          const data = JSON.parse(snap.data().data);
          callback(data, snap.metadata && snap.metadata.hasPendingWrites);
        } catch(e) {}
      }
    });
  }
};

// ─── MENU DATA ───────────────────────────────────────────────────────────────
const MENU = {
  salad:    { label:"Salad 沙拉", emoji:"🥗", items:[
    {id:"s1",name:"煙燻鮭魚生菜沙拉",sub:"胡麻／油醋",dressing:true,member:330,normal:330},
    {id:"s2",name:"酪梨鮮蝦沙拉",    sub:"胡麻／油醋",dressing:true,member:330,normal:330},
    {id:"s3",name:"七股炸牡蠣沙拉",  sub:"胡麻／油醋",dressing:true,member:330,normal:330},
  ]},
  appetizer:{ label:"Appetizer 特色前菜", emoji:"🍢", items:[
    {id:"du1",name:"🍈芒果莎莎花束沙拉",sub:"榴槤季·季節限定",member:180,normal:180,season:true},
    {id:"a1",name:"炙烤焦糖鮭魚蒔蘿奶酪捲",member:300,normal:300},
    {id:"a2",name:"油封蒜油馬鈴薯蝦滑",    member:240,normal:240},
    {id:"a3",name:"西西里肉醬嫩蛋",        member:240,normal:240},
    {id:"a4",name:"香煎薄鹽櫛瓜與帕瑪森起司",sub:"蛋奶素",member:240,normal:240},
    {id:"a5",name:"火山奶油雞翅",          member:330,normal:330},
    {id:"a6",name:"今鶴家唐揚雞",          member:240,normal:240},
    {id:"a7",name:"義式肉醬脆皮餃",        member:270,normal:270},
    {id:"a8",name:"法式脆薯佐松露奶醬",    member:240,normal:240},
  ]},
  brunch:   { label:"Brunch 早午餐", emoji:"🍳", items:[
    {id:"b1",name:"和風醬燒梅子雞",        sub:"早午餐",member:420,normal:480},
    {id:"b2",name:"安格斯嫩煎牛排",        sub:"早午餐",member:450,normal:510},
    {id:"b3",name:"歐風蜜香炙烤雞腿",      sub:"早午餐",member:420,normal:480},
    {id:"b4",name:"蔥鹽蒜炒雞松阪",        sub:"早午餐",member:450,normal:510},
    {id:"b5",name:"起司奶油鮮蔬燉菜",      sub:"早午餐 蛋奶素",member:390,normal:450},
    {id:"b6",name:"北海道奶油海鮮燉菜",    sub:"早午餐",member:420,normal:480},
    {id:"b7",name:"伊比利慢烤豬酥脆三明治",sub:"早午餐",member:480,normal:540},
    {id:"b8",name:"煙燻鮭魚酥脆三明治",    sub:"早午餐",member:390,normal:450},
    {id:"b9",name:"乾煎培根酥脆三明治",    sub:"早午餐",member:360,normal:420},
  ]},
  pasta:    { label:"Pasta 義大利麵", emoji:"🍝", items:[
    {id:"du2",name:"🍈白醬鮮蝦榴槤義大利麵",sub:"榴槤季·可升級套餐",member:420,normal:480,season:true},
    {id:"p1", name:"慢烤蒜酥小羔羊＋金沙辣奶油 🌶️",member:690,normal:750},
    {id:"p2", name:"炙燒干貝海鮮＋番紅花米蘭醬",   member:660,normal:720},
    {id:"p3", name:"香煎櫻桃鴨＋松露奶油醬",       member:510,normal:570},
    {id:"p4", name:"伊比利蒜香慢烤豬＋濃郁椒香麻奶 🌶️",member:660,normal:720},
    {id:"p5", name:"安格斯黑牛＋香蒜辣炒 🌶️",      member:450,normal:510},
    {id:"p6", name:"爐烤雞腿＋香蒜辣炒 🌶️",        member:390,normal:450},
    {id:"p7", name:"七股蛤蜊＋法式白酒清炒",        member:360,normal:420,toggles:["不辣","不白酒"]},
    {id:"p8", name:"挪威鮭魚＋香蒜辣炒 🌶️",        member:390,normal:450},
    {id:"p9", name:"爐烤雞腿＋北海道奶油",          member:390,normal:450},
    {id:"p10",name:"安格斯黑牛＋地中海茄汁",        member:450,normal:510},
    {id:"p11",name:"安格斯黑牛＋濃郁椒香麻奶 🌶️",  member:450,normal:510},
    {id:"p12",name:"海鮮總匯＋菠菜青醬",            member:390,normal:450},
    {id:"p13",name:"七股蛤蜊＋煙花女 🌶️",          member:390,normal:450},
    {id:"p14",name:"酥炸魚排＋菠菜青醬",            member:360,normal:420},
    {id:"p15",name:"半熟蛋＋黑松露草菇",sub:"蛋奶素",member:360,normal:420},
  ]},
  pizza:    { label:"Pizza 披薩", emoji:"🍕", items:[
    {id:"pz1",name:"松露野菇起司半熟蛋",sub:"蛋奶素",member:390,normal:450},
    {id:"pz2",name:"伊比利蒜香慢烤豬",              member:450,normal:510},
    {id:"pz3",name:"經典瑪格麗特",sub:"蛋奶素",     member:360,normal:420},
  ]},
  risotto:  { label:"Risotto 燉飯", emoji:"🍚", items:[
    {id:"r1", name:"慢烤蒜酥小羔羊＋番紅花米蘭醬",  member:720,normal:780},
    {id:"r2", name:"伊比利蒜香慢烤豬＋番紅花米蘭醬",member:720,normal:780},
    {id:"r3", name:"乾煎杏鮑菇＋番紅花米蘭醬",sub:"蛋奶素",member:450,normal:510},
    {id:"r4", name:"炙烤骰子牛＋菠菜青醬",          member:450,normal:510},
    {id:"r5", name:"焗烤海量蛤蜊＋菠菜青醬",        member:480,normal:540},
    {id:"r6", name:"炙烤焦糖鮭魚＋北海道奶油",      member:390,normal:450},
    {id:"r7", name:"爐烤雞腿＋北海道奶油",          member:390,normal:450},
    {id:"r8", name:"海鮮總匯＋北海道奶油",          member:390,normal:450},
    {id:"r9", name:"酥炸牡蠣＋金沙辣奶油 🌶️",      member:420,normal:480},
    {id:"r10",name:"醬烤戰斧豬＋黑松露草菇",        member:570,normal:630},
    {id:"r11",name:"嫩煎鮮蝦干貝＋濃郁南瓜",        member:530,normal:590},
    {id:"r12",name:"安格斯黑牛＋黃金起司",          member:450,normal:510},
    {id:"r13",name:"爐烤雞腿＋黃金起司",            member:390,normal:450},
    {id:"r14",name:"酥炸魚排＋香辣墨魚 🌶️",        member:390,normal:450},
    {id:"r15",name:"半熟蛋＋牛肝菌燉飯",sub:"蛋奶素",member:330,normal:390},
  ]},
  dessert:  { label:"Dessert 甜點", emoji:"🍮", items:[
    {id:"du4",name:"🍈榴槤忘返舒芙蕾",sub:"榴槤季·季節限定",member:330,normal:330,season:true},
    {id:"du6",name:"🍈榴槤起司紫薯球",sub:"榴槤季·季節限定",member:180,normal:180,season:true},
    {id:"d1",name:"熔岩流沙鹹蛋黃＋舒芙蕾",
     sub:"⚠ 一次只能做2顆，第3顆需等下一輪（每次45分–1小時），1顆約2-3人分食",
     member:270,normal:270},
    {id:"d2",name:"黑糖珍珠厚奶茶＋舒芙蕾",
     sub:"⚠ 一次只能做2顆，第3顆需等下一輪（每次45分–1小時），1顆約2-3人分食",
     member:240,normal:240},
    {id:"d3",name:"烤布蕾法式吐司",member:240,normal:240},
  ]},
  classic:  { label:"Classic Bites 經典小品", emoji:"🍟", items:[
    {id:"c1",name:"酥炸脆薯",           member:120,normal:120},
    {id:"c2",name:"招牌濃湯",           member:90, normal:90},
    {id:"c3",name:"硬式法國麵包（2片）", member:60, normal:60},
    {id:"c4",name:"今鶴楓糖可頌",       member:60, normal:60},
    {id:"c5",name:"今日甜點",           member:60, normal:60},
    {id:"c6",name:"堅果優格",           member:60, normal:60},
  ]},
  styled:   { label:"Styled Drinks 造型飲品", emoji:"🧋",
    note:"手工製作，每杯約25–30分鐘｜請選擇造型：柴柴棉花糖 或 泡澡熊", items:[
    {id:"sd1",name:"沖繩黑糖珍珠鮮奶茶",price:175,fixedIce:true, fixedSugar:true, needsMascot:true},
    {id:"sd2",name:"沖繩黑糖鮮奶茶",    price:165,noRemoveIce:true,fixedSugar:true,needsMascot:true},
    {id:"sd3",name:"寶寶歐蕾",          price:185,noRemoveIce:true,fixedSugar:true,needsMascot:true},
    {id:"sd4",name:"白桃烏龍鮮奶茶",    price:195,noRemoveIce:true,hasSugar:true,  needsMascot:true},
    {id:"sd5",name:"經典拿鐵",          price:175,noRemoveIce:true,fixedSugar:true,needsMascot:true},
    {id:"sd6",name:"焦糖拿鐵",sub:"含焦糖醬",price:185,noRemoveIce:true,fixedSugar:true,needsMascot:true},
  ]},
  milktea:  { label:"Milk Tea 歐蕾系列", emoji:"🥛", items:[
    {id:"mt1",name:"沖繩黑糖珍珠鮮奶茶",price:110,fixedIce:true,  fixedSugar:true},
    {id:"mt2",name:"沖繩黑糖鮮奶茶",    price:100,noRemoveIce:true,fixedSugar:true},
    {id:"mt3",name:"寶寶歐蕾",          price:120,noRemoveIce:true,fixedSugar:true},
    {id:"mt4",name:"白桃烏龍鮮奶茶",    price:130,hasIce:true,    hasSugar:true},
    {id:"mt5",name:"TWG法式伯爵鮮奶茶", price:190,twgIce:true,    fixedSugar:true},
    {id:"mt6",name:"TWG焦糖奶油鮮奶茶", price:190,twgIce:true,    fixedSugar:true},
  ]},
  specials: { label:"House Specials 享特調", emoji:"🍹", note:"固定冰、糖", items:[
    {id:"du3",name:"🍈榴槤波波椰椰",price:150,fixedIce:true,fixedSugar:true,season:true},
    {id:"du5",name:"🍈烤糖榴槤奶蓋拿鐵",price:150,fixedIce:true,fixedSugar:true,season:true},
    {id:"sp1",name:"白桃柚香烏龍",  price:120,fixedIce:true,fixedSugar:true},
    {id:"sp2",name:"白桃蘋果紅茶",  price:120,fixedIce:true,fixedSugar:true},
    {id:"sp3",name:"芭樂蜂蜜青茶",  price:130,fixedIce:true,fixedSugar:true},
  ]},
  sparkling:{ label:"氣泡飲", emoji:"🫧", note:"固定冰、糖", items:[
    {id:"sp4",name:"冰山美人氣泡飲",     price:130,fixedIce:true,fixedSugar:true},
    {id:"sp5",name:"紅心芭樂乳酸氣泡飲", price:130,fixedIce:true,fixedSugar:true},
    {id:"sp6",name:"蜂蜜檸檬氣泡飲",     price:100,fixedIce:true,fixedSugar:true},
  ]},
  tea:      { label:"精選茶", emoji:"🍵", items:[
    {id:"t1",name:"四季青茶",  price:80, hasIce:true,hasSugar:true},
    {id:"t2",name:"阿薩姆紅茶",price:80, hasIce:true,hasSugar:true},
    {id:"t3",name:"茉莉綠茶",  price:80, hasIce:true,hasSugar:true},
    {id:"t4",name:"白桃烏龍",  price:110,hasIce:true,hasSugar:true},
    {id:"t5",name:"海鹽奶蓋紅茶",price:100,fixedIce:true,hasSugar:true,note:"固定少冰"},
    {id:"t6",name:"海鹽奶蓋綠茶",price:100,fixedIce:true,hasSugar:true,note:"固定少冰"},
    {id:"t7",name:"海鹽奶蓋青茶",price:100,fixedIce:true,hasSugar:true,note:"固定少冰"},
  ]},
  coffee:   { label:"義式咖啡", emoji:"☕", note:"固定無糖", items:[
    {id:"cf1",name:"經典拿鐵",      price:110,hasIce:true,  fixedSugar:true},
    {id:"cf2",name:"美式咖啡",      price:80, hasIce:true,  fixedSugar:true},
    {id:"cf3",name:"紅心芭樂美式",  price:110,fixedIce:true,fixedSugar:true,note:"固定少冰"},
    {id:"cf4",name:"西西里氣泡咖啡",price:120,fixedIce:true,fixedSugar:true},
    {id:"cf5",name:"焦糖拿鐵",sub:"含焦糖醬",price:120,hasIce:true,fixedSugar:true},
    {id:"cf6",name:"竹炭拿鐵",      price:130,noRemoveIce:true,fixedSugar:true},
  ]},
  brewed:   { label:"沖泡茶（熱飲）", emoji:"🫖", note:"只有熱飲，固定無糖", items:[
    {id:"bt1",name:"天然花草茶",    price:150,fixedIce:true,fixedSugar:true},
    {id:"bt2",name:"TWG法式伯爵茶", price:160,fixedIce:true,fixedSugar:true},
    {id:"bt3",name:"TWG焦糖奶油茶", price:160,fixedIce:true,fixedSugar:true},
  ]},
  juice:    { label:"果汁 & 汽水", emoji:"🥤", note:"固定冰、糖", items:[
    {id:"j1",name:"青森蘋果汁",price:150,fixedIce:true,fixedSugar:true},
    {id:"j2",name:"可樂",      price:80, fixedIce:true,fixedSugar:true},
    {id:"j3",name:"雪碧",      price:80, fixedIce:true,fixedSugar:true},
  ]},
  beer:     { label:"🍺 啤酒", emoji:"🍺", note:"酒類不可升級套餐", items:[
    {id:"be1",name:"莫雷帝拉格啤酒 Birra Moretti",        price:150,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"be2",name:"MORITZ莫里茲經典啤酒",                price:130,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"be3",name:"MORITZ EPIDOR艾比多強化啤酒",         price:160,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"be4",name:"MORITZ RADLER莫里茲檸檬原汁啤酒",     price:180,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"be5",name:"AMBAR IPA安柏IPA精釀啤酒",            price:180,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"be6",name:"可倫堡1664白啤酒 KRONENBOURG BLANC",  price:160,fixedIce:true,fixedSugar:true,isAlcohol:true},
  ]},
  wine:     { label:"🍷 紅白酒（瓶裝）", emoji:"🍷", note:"酒類不可升級套餐", items:[
    {id:"wn1",name:"攀島粉鑽水果紅酒 SANGRIA",                    price:1500,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn2",name:"Bordeaux Rouge 法國波爾多拉法葉紅酒",          price:1080,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn3",name:"Piccini畢利旗佳釀紅酒",                       price:980, fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn4",name:"CABERNET SAUVIGNON羅伯蒙岱維酒莊紅酒",        price:1380,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn5",name:"Sauvignon Blanc 白蘇維翁白葡萄酒",            price:980, fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn6",name:"Bordeaux Supérieur 純種馬爾貝克茗藤紅酒",     price:1380,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn7",name:"Vietti Moscato d'Asti 慕斯卡艾斯提白酒",      price:1280,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn8",name:"PENFOLDS KOONUNGA HILL 夏多內白酒",           price:980, fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn9",name:"Vespa Bianca Terra Fiano 菲亞諾白酒",         price:1080,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn10",name:"Vespa Bruno Primitivo 布魯諾莊主紅酒",       price:1080,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn11",name:"Ca' dei Frati I Frati Lugana 修道士白酒",    price:1380,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn12",name:"LUCIDO CATARATIO露西多白酒",                 price:1080,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"wn13",name:"Brachetto d'Acqui DOCG 女王微甜紅酒",        price:980, fixedIce:true,fixedSugar:true,isAlcohol:true},
  ]},
  nonalc:   { label:"🥂 無酒精系列", emoji:"🥂", note:"酒類不可升級套餐", items:[
    {id:"na1",name:"瓶- Domaine De La Prade 梅洛&西拉子無酒精紅酒 750ml", price:1180,fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"na2",name:"杯- Domaine De La Prade 梅洛&西拉子無酒精紅酒 150ml", price:220, fixedIce:true,fixedSugar:true,isAlcohol:true},
    {id:"na3",name:"瓶- 伊威無酒精粉紅酒 Edenvale 750ml",                price:850, fixedIce:true,fixedSugar:true,isAlcohol:true},
  ]},
  pets:     { label:"🐾 寵物餐 Pets", emoji:"🐾", note:"本店皆使用寵物專用食品，無添加調味", items:[
    {id:"pt1",name:"毛孩吃舒肥牛",  sub:"舒肥牛排130g、花椰菜、水煮蛋、寵物牛奶", price:300,fixedIce:true,fixedSugar:true},
    {id:"pt2",name:"毛孩吃雞胸肉",  sub:"雞胸130g、花椰菜、水煮蛋、寵物牛奶",     price:240,fixedIce:true,fixedSugar:true},
  ]},
};

const FOOD_CATS  = ["salad","appetizer","brunch","pasta","pizza","risotto","dessert","classic","pets"];
const DRINK_CATS = ["styled","milktea","specials","sparkling","tea","coffee","brewed","juice","beer","wine","nonalc"];
const MAIN_CATS  = ["brunch","pasta","pizza","risotto"];
const SET_MEALS  = [
  {id:"A",label:"A 經典套餐",price:150,desc:"湯品、麵包、任選飲品折抵80元"},
  {id:"B",label:"B 甜點套餐",price:120,desc:"季節甜點、任選飲品折抵80元"},
  {id:"C",label:"C 湯品套餐",price:120,desc:"湯品、任選飲品折抵80元"},
];
const ICE_FULL = ["冰","去冰","熱"];
const ICE_NO_REMOVE = ["冰","熱"];
const ICE_TWG = ["去冰","熱"];
const SUGAR_OPT = ["無糖","三分糖","五分糖","七分糖","全糖"];
const MASCOT_OPT = ["柴柴棉花糖","泡澡熊"];
const DRESSING_OPT = ["胡麻醬","油醋醬"];

function getItemPrice(item, isMember) {
  if (item.price !== undefined) return item.price;
  return isMember ? item.member : item.normal;
}

function getIceOptions(item) {
  if (item.fixedIce) return null;
  if (item.twgIce) return ICE_TWG;
  if (item.noRemoveIce) return ICE_NO_REMOVE;
  if (item.hasIce) return ICE_FULL;
  return null;
}

function addMinutes(timeStr, mins) {
  if (!timeStr) return "";
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return timeStr;
  const total = parseInt(m[1])*60 + parseInt(m[2]) + mins;
  return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function findItem(id) {
  for (const cat of [...FOOD_CATS, ...DRINK_CATS]) {
    const found = MENU[cat]?.items.find(i => i.id === id);
    if (found) return found;
  }
  return null;
}

function getItemCategory(item) {
  const catLabels = {
    salad:"沙拉", appetizer:"前菜", brunch:"早午餐", pasta:"義大利麵",
    pizza:"披薩", risotto:"燉飯", dessert:"甜點", classic:"小品",
    styled:"造型飲品", milktea:"歐蕾", specials:"特調", sparkling:"氣泡飲",
    tea:"精選茶", coffee:"咖啡", brewed:"沖泡茶", juice:"果汁/汽水",
    beer:"啤酒", wine:"紅白酒", nonalc:"無酒精", pets:"寵物餐"
  };
  for (const cat of [...FOOD_CATS, ...DRINK_CATS]) {
    if (MENU[cat]?.items.find(i => i.id === item.id)) return catLabels[cat] || cat;
  }
  return "";
}

function isAlcohol(item) {
  return ["beer","wine","nonalc"].some(c => MENU[c]?.items.find(i => i.id === item.id));
}

function isMainDish(item) {
  return MAIN_CATS.some(c => MENU[c]?.items.find(i => i.id === item.id));
}

function isDrink(item) {
  return DRINK_CATS.some(c => MENU[c]?.items.find(i => i.id === item.id));
}

function makeLineId() { return Date.now() + Math.random().toString(36).slice(2,6); }

function linePrice(line, isMember) {
  if (line.custom) return (Number(line.price)||0) * (line.qty||1);
  const item = findItem(line.itemId);
  if (!item) return 0;
  let p = getItemPrice(item, isMember);
  if (line.setMeal) {
    const sm = SET_MEALS.find(s => s.id === line.setMeal.id);
    p += sm?.price || 0;
    if (line.setMeal.drink) {
      p += Math.max(0, line.setMeal.drink.price - 80);
    }
  }
  return p;
}

function linePriceBreakdown(line, isMember) {
  const item = findItem(line.itemId);
  if (!item) return null;
  const basePrice = getItemPrice(item, isMember);
  if (!line.setMeal) return null;
  const sm = SET_MEALS.find(s => s.id === line.setMeal.id);
  const setPrice = sm?.price || 0;
  const drinkPrice = line.setMeal.drink ? line.setMeal.drink.price : 0;
  const discount = line.setMeal.drink ? 80 : 0;
  return { basePrice, setPrice, drinkPrice, discount, total: basePrice + setPrice + Math.max(0, drinkPrice - discount) };
}

function orderTotal(lines, isMember) {
  return lines.reduce((s, l) => s + linePrice(l, isMember), 0);
}

function orderTotalWithService(lines, isMember) {
  const subtotal = orderTotal(lines, isMember);
  return Math.round(subtotal * 1.1);
}

function calcMemberFee(lines, memberType) {
  if (memberType !== "new") return { fee: 0, discount: 0 };
  // Check if any appetizer OR alcohol is ordered (only discount once)
  const hasAppetizer = lines.some(l => MENU["appetizer"]?.items.find(i => i.id === l.itemId));
  const hasAlcohol = lines.some(l => ["beer","wine","nonalc"].some(c => MENU[c]?.items.find(i => i.id === l.itemId)));
  return { fee: 100, discount: (hasAppetizer || hasAlcohol) ? 100 : 0 };
}

function lineComplete(line) {
  const item = findItem(line.itemId);
  if (!item) return true;
  if (item.dressing && !line.dressing) return false;
  if (item.hasSugar && !line.sugar) return false;
  if (item.needsMascot && !line.mascot) return false;
  return true;
}

// ─── DRINK SELECTOR MODAL ────────────────────────────────────────────────────
function DrinkModal({ onSelect, onClose, discount = 0, itemVisible }) {
  const [cat, setCat] = useState("styled");
  const [chosen, setChosen] = useState(null);
  const [ice, setIce] = useState(null);
  const [sugar, setSugar] = useState(null);
  const [mascot, setMascot] = useState(null);
  const items = (MENU[cat]?.items || []).filter(i=>!itemVisible||itemVisible(i));
  const item = items.find(i => i.id === chosen);
  const iceOpts = item ? getIceOptions(item) : null;

  const canConfirm = chosen &&
    (!iceOpts || ice) &&
    (!item?.hasSugar || sugar) &&
    (!item?.needsMascot || mascot);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{width:"100%",maxHeight:"90vh",background:"#ffffff",borderRadius:"24px 24px 0 0",border:"1px solid #d8c2a2",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 18px 8px",borderBottom:"1px solid #e6d6bd"}}>
          <div style={{fontSize:"17px",fontWeight:"700",color:"#9c5a1c",fontFamily:"'Noto Serif TC',serif"}}>選擇飲品</div>
          {discount>0 && <div style={{fontSize:"13px",color:"#b06010"}}>套餐飲品折抵 ${discount}</div>}
        </div>
        <div style={{display:"flex",overflowX:"auto",padding:"8px 12px",gap:"6px",borderBottom:"1px solid #e6d6bd"}}>
          {DRINK_CATS.map(k=>(
            <button key={k} onClick={()=>{setCat(k);setChosen(null);setIce(null);setSugar(null);setMascot(null);}}
              style={{flexShrink:0,padding:"5px 12px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:cat===k?"#b07840":"#e6d6bd",color:cat===k?"#fff":"#b06010"}}>
              {MENU[k].emoji} {MENU[k].label.split(" ").pop().substring(0,5)}
            </button>
          ))}
        </div>
        {MENU[cat]?.note && <div style={{fontSize:"12px",color:"#8a6e50",padding:"5px 14px",background:"#f5ede0"}}>※ {MENU[cat].note}</div>}
        <div style={{overflowY:"auto",flex:1,padding:"8px 14px"}}>
          {items.map(it=>(
            <div key={it.id} onClick={()=>{setChosen(it.id);setIce(null);setSugar(null);setMascot(null);}}
              style={{padding:"10px 12px",marginBottom:"6px",borderRadius:"10px",cursor:"pointer",
                background:chosen===it.id?"#f6e3cf":"#fdf6ec",border:`1px solid ${chosen===it.id?"#b07840":"#e6d6bd"}`,
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"11px",color:"#3f8f63",marginBottom:"2px"}}>{"["+getItemCategory(it)+"]"}</div>
                <div style={{fontSize:"15px",color:"#3a2a18",fontWeight:chosen===it.id?"700":"400"}}>{it.name}</div>
                {it.sub&&<div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>{it.sub}</div>}
              </div>
              <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"700",whiteSpace:"nowrap",marginLeft:"8px"}}>
                ${it.price}{discount>0&&chosen===it.id&&<span style={{fontSize:"12px",color:"#3f8f63"}}> -{discount}</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px",borderTop:"1px solid #e6d6bd"}}>
          <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:"12px",background:"#e6d6bd",border:"none",color:"#b06010",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>取消</button>
        </div>
      </div>
      {item && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:320,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}
          onClick={(e)=>{e.stopPropagation();setChosen(null);setIce(null);setSugar(null);setMascot(null);}}>
          <div style={{background:"#fdfaf4",borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"340px",border:"1px solid #d0c0a8",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"18px",fontWeight:"700",color:"#6a4a2e",marginBottom:"2px",textAlign:"center",fontFamily:"'Noto Serif TC',serif"}}>{item.name}</div>
            <div style={{fontSize:"14px",color:"#9c5a1c",fontWeight:"700",marginBottom:"14px",textAlign:"center"}}>${item.price}{discount>0&&<span style={{fontSize:"13px",color:"#3f8f63"}}> 折抵 -{discount}</span>}</div>
            {iceOpts && (
              <div style={{marginBottom:"14px"}}>
                <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"6px",textAlign:"center"}}>冰量（必選）</div>
                <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}}>
                  {iceOpts.map(o=><button key={o} onClick={()=>setIce(o)}
                    style={{padding:"11px 22px",borderRadius:"10px",cursor:"pointer",fontSize:"16px",fontWeight:"700",
                      background:ice===o?"#e8920a":"#fff4e0",color:ice===o?"#fff":"#b06010",border:ice===o?"2px solid #e8920a":"2px solid #e8b060"}}>{ice===o?"✓ ":""}{o}</button>)}
                </div>
              </div>
            )}
            {item.hasSugar && (
              <div style={{marginBottom:"14px"}}>
                <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"6px",textAlign:"center"}}>甜度（必選）</div>
                <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}}>
                  {SUGAR_OPT.map(o=><button key={o} onClick={()=>setSugar(o)}
                    style={{padding:"10px 16px",borderRadius:"10px",cursor:"pointer",fontSize:"15px",fontWeight:"700",
                      background:sugar===o?"#e8920a":"#fff4e0",color:sugar===o?"#fff":"#b06010",border:sugar===o?"2px solid #e8920a":"2px solid #e8b060"}}>{sugar===o?"✓ ":""}{o}</button>)}
                </div>
              </div>
            )}
            {item.needsMascot && (
              <div style={{marginBottom:"14px"}}>
                <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"6px",textAlign:"center"}}>造型（必選）</div>
                <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}}>
                  {MASCOT_OPT.map(o=><button key={o} onClick={()=>setMascot(o)}
                    style={{padding:"11px 18px",borderRadius:"10px",cursor:"pointer",fontSize:"16px",fontWeight:"700",
                      background:mascot===o?"#e8920a":"#fff4e0",color:mascot===o?"#fff":"#b06010",border:mascot===o?"2px solid #e8920a":"2px solid #e8b060"}}>{mascot===o?"✓ ":""}{o}</button>)}
                </div>
              </div>
            )}
            {!iceOpts && !item.hasSugar && !item.needsMascot && (
              <div style={{fontSize:"13px",color:"#8a6e50",marginBottom:"14px",textAlign:"center",lineHeight:"1.5"}}>此飲品無需特別選項，<br/>確認即可加入。</div>
            )}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setChosen(null);setIce(null);setSugar(null);setMascot(null);}}
                style={{flex:1,padding:"13px",borderRadius:"12px",background:"#e6d6bd",border:"none",color:"#b06010",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>返回</button>
              <button disabled={!canConfirm} onClick={()=>{
                const iceVal = item.fixedIce ? null : ice;
                onSelect({...item, ice:iceVal, sugar:item.fixedSugar?null:sugar, mascot});
              }} style={{flex:2,padding:"13px",borderRadius:"12px",border:"none",cursor:canConfirm?"pointer":"default",fontSize:"16px",fontWeight:"700",
                background:canConfirm?"#b07840":"#e6d6bd",color:canConfirm?"#fff":"#b8a892"}}>
                {canConfirm?"確認加入":"請完成選項"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LINE ITEM CARD ───────────────────────────────────────────────────────────
function LineCard({ line, isMember, onRemove, onUpdate, onAddSet, onChangeSet, disabled }) {
  const item = findItem(line.itemId);
  if (!item) return null;
  const isMain = isMainDish(item);
  const iceOpts = getIceOptions(item);
  const complete = lineComplete(line);

  return (
    <div style={{background:complete?"#fdf4e8":"#fcebe4",borderRadius:"14px",padding:"14px",marginBottom:"10px",
      border:`1.5px solid ${complete?"#e0cdb0":"#e09a8a"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"16px",color:"#3a2a18",fontWeight:"700"}}>{item.name}</div>
          {item.sub&&!item.sub.startsWith("⚠")&&<div style={{fontSize:"12px",color:"#7a5e42",marginTop:"2px"}}>{item.sub}</div>}
          {item.sub?.startsWith("⚠")&&<div style={{fontSize:"12px",color:"#a8741e",marginTop:"4px",lineHeight:"1.6"}}>{item.sub}</div>}
          <div style={{fontSize:"15px",color:"#9c5a1c",marginTop:"4px"}}>${getItemPrice(item,isMember)}</div>
        </div>
        {!disabled&&<button onClick={onRemove}
          style={{padding:"4px 10px",borderRadius:"8px",border:"1px solid #e6b0a0",background:"none",color:"#d05a36",fontSize:"13px",cursor:"pointer",marginLeft:"8px"}}>
          刪除
        </button>}
      </div>
      {!disabled && item.dressing && (
        <div style={{marginTop:"8px"}}>
          <div style={{fontSize:"12px",color:line.dressing?"#7a5e42":"#d05a36",marginBottom:"4px"}}>醬料{!line.dressing?" (必選)":""}</div>
          <div style={{display:"flex",gap:"5px"}}>
            {DRESSING_OPT.map(d=><button key={d} onClick={()=>onUpdate({dressing:d})}
              style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:line.dressing===d?"#b07840":"#e6d6bd",color:line.dressing===d?"#fff":"#8a6a48"}}>{d}</button>)}
          </div>
        </div>
      )}
      {!disabled && iceOpts && (
        <div style={{marginTop:"8px"}}>
          <div style={{fontSize:"12px",color:"#7a5e42",marginBottom:"4px"}}>冰量</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {iceOpts.map(o=><button key={o} onClick={()=>onUpdate({ice:o})}
              style={{padding:"4px 10px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:line.ice===o?"#b07840":"#e6d6bd",color:line.ice===o?"#fff":"#8a6a48"}}>{o}</button>)}
          </div>
        </div>
      )}


      {!disabled && item.hasSugar && (
        <div style={{marginTop:"8px"}}>
          <div style={{fontSize:"12px",color:line.sugar?"#7a5e42":"#d05a36",marginBottom:"4px"}}>甜度{!line.sugar?" (必選)":""}</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {SUGAR_OPT.map(o=><button key={o} onClick={()=>onUpdate({sugar:o})}
              style={{padding:"4px 10px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:line.sugar===o?"#b07840":"#e6d6bd",color:line.sugar===o?"#fff":"#8a6a48"}}>{o}</button>)}
          </div>
        </div>
      )}
      {!disabled && item.needsMascot && (
        <div style={{marginTop:"8px"}}>
          <div style={{fontSize:"12px",color:line.mascot?"#7a5e42":"#d05a36",marginBottom:"4px"}}>造型{!line.mascot?" (必選)":""}</div>
          <div style={{display:"flex",gap:"5px"}}>
            {MASCOT_OPT.map(o=><button key={o} onClick={()=>onUpdate({mascot:o})}
              style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:line.mascot===o?"#b07840":"#e6d6bd",color:line.mascot===o?"#fff":"#8a6a48"}}>{o}</button>)}
          </div>
        </div>
      )}
      {line.dressing&&<div style={{marginTop:"4px",fontSize:"12px",color:"#3f8f63"}}>醬料：{line.dressing}</div>}
      {line.ice&&<div style={{marginTop:"2px",fontSize:"12px",color:"#3f8f63"}}>冰量：{line.ice}</div>}
      {line.sugar&&<div style={{marginTop:"2px",fontSize:"12px",color:"#3f8f63"}}>甜度：{line.sugar}</div>}
      {line.mascot&&<div style={{marginTop:"2px",fontSize:"12px",color:"#3f8f63"}}>造型：{line.mascot}</div>}
      {line.toggles&&line.toggles.length>0&&<div style={{marginTop:"2px",fontSize:"12px",color:"#e8a030",fontWeight:"700"}}>{line.toggles.join("、")}</div>}
      {isMain && !disabled && !isAlcohol(item) && (
        <div style={{marginTop:"10px",borderTop:"1px solid #e6d6bd",paddingTop:"10px"}}>
          {!line.setMeal ? (
            <button onClick={onAddSet}
              style={{padding:"6px 14px",borderRadius:"10px",border:"1px dashed #d8c2a2",background:"transparent",color:"#8a6a48",fontSize:"13px",cursor:"pointer"}}>
              + 加選套餐（+$120~150）
            </button>
          ) : (
            <div style={{background:"#eaf6ec",borderRadius:"10px",padding:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"14px",color:"#3f8f63",fontWeight:"700"}}>{SET_MEALS.find(s=>s.id===line.setMeal.id)?.label}</div>
                  {line.setMeal.drink ? (
                    <div style={{fontSize:"13px",color:"#7a5e42",marginTop:"2px"}}>
                      飲品：{line.setMeal.drink.name}
                      {line.setMeal.drink.ice&&` · ${line.setMeal.drink.ice}`}
                      {line.setMeal.drink.mascot&&` · ${line.setMeal.drink.mascot}`}
                    </div>
                  ) : (
                    <div style={{fontSize:"13px",color:"#d05a36",marginTop:"2px"}}>請選擇飲品（必選）</div>
                  )}
                </div>
                <div style={{display:"flex",gap:"5px"}}>
                  <button onClick={onChangeSet}
                    style={{padding:"3px 8px",borderRadius:"6px",border:"1px solid #bcd8bf",background:"none",color:"#3f8f63",fontSize:"12px",cursor:"pointer"}}>
                    {line.setMeal.drink?"換飲品":"選飲品"}
                  </button>
                  <button onClick={()=>onUpdate({setMeal:null})}
                    style={{padding:"3px 8px",borderRadius:"6px",border:"1px solid #e6b0a0",background:"none",color:"#d05a36",fontSize:"12px",cursor:"pointer"}}>
                    取消套餐
                  </button>
                </div>
              </div>
              {line.setMeal.drink && (()=>{
                const sm = SET_MEALS.find(s=>s.id===line.setMeal.id);
                const drinkPrice = line.setMeal.drink.price;
                const setPrice = sm?.price||0;
                const extra = Math.max(0, drinkPrice-80);
                return(
                  <div style={{marginTop:"8px",fontSize:"12px",color:"#5a8a6a",lineHeight:"1.9",borderTop:"1px solid #d4e4d6",paddingTop:"6px"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span>主餐</span><span>${getItemPrice(item,isMember)}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span>套餐費（{sm?.label}）</span><span>+${setPrice}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span>飲品 ${drinkPrice} - 折抵$80</span><span>+${extra}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",color:"#9c5a1c",fontWeight:"700",borderTop:"1px solid #cadccb",marginTop:"2px",paddingTop:"2px"}}>
                      <span>小計</span><span>${getItemPrice(item,isMember)+setPrice+extra}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
      {isMain && disabled && line.setMeal && (
        <div style={{marginTop:"8px",fontSize:"13px",color:"#3f8f63"}}>
          套餐：{SET_MEALS.find(s=>s.id===line.setMeal.id)?.label}
          {line.setMeal.drink&&` · ${line.setMeal.drink.name}`}
        </div>
      )}
    </div>
  );
}


// ─── ITEM CHOICE MODAL ───────────────────────────────────────────────────────
function ItemChoiceModal({ item, isMember, onConfirm, onClose }) {
  const [ice, setIce] = useState(null);
  const [sugar, setSugar] = useState(null);
  const [mascot, setMascot] = useState(null);
  const [dressing, setDressing] = useState(null);
  const [toggles, setToggles] = useState([]);

  const iceOpts = getIceOptions(item);
  const needsIce = !!iceOpts;
  const needsSugar = !!item.hasSugar;
  const needsMascot = !!item.needsMascot;
  const needsDressing = !!item.dressing;

  const canConfirm = 
    (!needsIce || ice) &&
    (!needsSugar || sugar) &&
    (!needsMascot || mascot) &&
    (!needsDressing || dressing);

  const hasToggles = !!(item.toggles&&item.toggles.length);
  const hasOptions = needsIce || needsSugar || needsMascot || needsDressing || hasToggles || item.fixedIce || item.fixedSugar;

  if (!hasOptions) {
    // No options needed, confirm immediately
    onConfirm({ ice: null, sugar: null, mascot: null, dressing: null, toggles: [] });
    return null;
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:"#ffffff",borderRadius:"20px",padding:"20px",width:"100%",maxWidth:"320px",border:"1px solid #d8c2a2",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"16px",color:"#9c5a1c",fontWeight:"700",marginBottom:"4px"}}>{item.name}</div>
        {item.sub&&<div style={{fontSize:"12px",color:"#8a6e50",marginBottom:"12px"}}>{item.sub}</div>}
        <div style={{fontSize:"15px",color:"#9c5a1c",marginBottom:"16px"}}>${getItemPrice(item,isMember)}</div>

        {/* Toggles 特製選項(可複選) */}
        {hasToggles && (
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"4px"}}>特製需求（可複選）</div>
            <div style={{fontSize:"12px",color:"#b07020",marginBottom:"8px",lineHeight:"1.5"}}>本道料理為小辣，含白酒風味。<br/>無特殊需求可直接按「加入」。</div>
            <div style={{display:"flex",gap:"8px"}}>
              {item.toggles.map(t=>{
                const on=toggles.includes(t);
                return (
                  <button key={t} onClick={()=>setToggles(p=>on?p.filter(x=>x!==t):[...p,t])}
                    style={{flex:1,padding:"13px",borderRadius:"10px",cursor:"pointer",fontSize:"17px",fontWeight:"700",
                      background:on?"#e8920a":"#fff4e0",color:on?"#fff":"#b06010",border:on?"2px solid #e8920a":"2px solid #e8b060"}}>
                    {on?"✓ ":""}{t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Dressing */}
        {needsDressing && (
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"13px",color:dressing?"#7a5e42":"#d05a36",fontWeight:"700",marginBottom:"6px"}}>醬料（必選）</div>
            <div style={{display:"flex",gap:"8px"}}>
              {DRESSING_OPT.map(o=>(
                <button key={o} onClick={()=>setDressing(o)}
                  style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"15px",fontWeight:"700",
                    background:dressing===o?"#e8920a":"#fff4e0",color:dressing===o?"#fff":"#b06010"}}>{o}</button>
              ))}
            </div>
          </div>
        )}

        {/* Ice */}
        {needsIce && (
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"13px",color:ice?"#7a5e42":"#d05a36",fontWeight:"700",marginBottom:"6px"}}>冰量（必選）</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {iceOpts.map(o=>(
                <button key={o} onClick={()=>setIce(o)}
                  style={{flex:1,minWidth:"60px",padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"15px",fontWeight:"700",
                    background:ice===o?"#e8920a":"#fff4e0",color:ice===o?"#fff":"#b06010"}}>{o}</button>
              ))}
            </div>
          </div>
        )}
        {item.fixedIce && (
          <div style={{marginBottom:"14px",padding:"8px 12px",background:"#f0ebe0",borderRadius:"8px",fontSize:"13px",color:"#7a5c3e",fontWeight:"700"}}>
            🧊 冰量：{item.note||"固定少冰"}（此品項不可調整冰量）
          </div>
        )}

        {/* Sugar */}
        {needsSugar && (
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"13px",color:sugar?"#7a5e42":"#d05a36",fontWeight:"700",marginBottom:"6px"}}>甜度（必選）</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {SUGAR_OPT.map(o=>(
                <button key={o} onClick={()=>setSugar(o)}
                  style={{flex:1,minWidth:"60px",padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"14px",fontWeight:"700",
                    background:sugar===o?"#e8920a":"#fff4e0",color:sugar===o?"#fff":"#b06010"}}>{o}</button>
              ))}
            </div>
          </div>
        )}
        {item.fixedSugar && (
          <div style={{marginBottom:"14px",padding:"8px 12px",background:"#fdf8ef",borderRadius:"8px"}}>
          </div>
        )}

        {/* Mascot */}
        {needsMascot && (
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"13px",color:mascot?"#7a5e42":"#d05a36",fontWeight:"700",marginBottom:"6px"}}>造型（必選）</div>
            <div style={{display:"flex",gap:"8px"}}>
              {MASCOT_OPT.map(o=>(
                <button key={o} onClick={()=>setMascot(o)}
                  style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"14px",fontWeight:"700",
                    background:mascot===o?"#e8920a":"#fff4e0",color:mascot===o?"#fff":"#b06010"}}>{o}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:"12px",background:"#e6d6bd",border:"none",color:"#b06010",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>取消</button>
          <button disabled={!canConfirm} onClick={()=>onConfirm({ice,sugar,mascot,dressing,toggles})}
            style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",cursor:canConfirm?"pointer":"default",fontSize:"15px",fontWeight:"700",
              background:canConfirm?"#b07840":"#e6d6bd",color:canConfirm?"#fff":"#b8a892"}}>
            {canConfirm?"加入點餐 ✓":"請完成必選項目"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ORDER FLOW ───────────────────────────────────────────────────────────────
function OrderFlow({ group, existingOrder, onSubmit, onBack, nextNum, onUpdateGroup }) {
  const isMember = group.memberType !== "none";
  // ── 訂金(訂位人自助) ──
  const BANK_INFO = { bank:"台新銀行（812）成功分行", name:"今鶴餐飲有限公司", acct:"2085-01-0000754-1" };
  const depNeeded = needsDeposit(group.headcount, group.isVip);
  const depTotal = (()=>{const hc=(group.headcount||"").toLowerCase();const p=+((hc.match(/(\d+)p/)||[])[1]||0),c=+((hc.match(/(\d+)c/)||[])[1]||0),s=+((hc.match(/(\d+)s/)||[])[1]||0);return (p+c+s)||parseInt(hc)||0;})();
  const depAmount = group.isVip ? Math.max(depTotal,10)*100 : depTotal*100;
  const depStatus = group.depositStatus || (group.deposit ? "已核對" : (group.depositLast5 ? "待核對" : "未付"));
  // 訂金截止:一般=用餐前1天中午12:00前;用餐前1天才訂位=訂位後2小時內
  const depInfo = (()=>{
    const yr=new Date().getFullYear();
    const mm=(group.date||"").match(/^(\d{1,2})\/(\d{1,2})$/);
    const bm=(group.bookDate||"").match(/^(\d{1,2})\/(\d{1,2})$/);
    if(!mm) return {deadline:"",lastMinute:false,daysLeft:null};
    const meal=new Date(yr,+mm[1]-1,+mm[2]);
    const dayBefore=new Date(meal); dayBefore.setDate(meal.getDate()-1);
    const deadline=`${dayBefore.getMonth()+1}/${dayBefore.getDate()} 12:00`;
    let lastMinute=false;
    if(bm){ const book=new Date(yr,+bm[1]-1,+bm[2]); lastMinute=Math.round((meal-book)/86400000)<=1; }
    const now=new Date(); now.setHours(0,0,0,0);
    const daysLeft=Math.round((dayBefore-now)/86400000);
    return {deadline,lastMinute,daysLeft};
  })();
  const depDeadline = depInfo.deadline;
  const depDaysLeft = depInfo.daysLeft;
  const [isBooker,setIsBooker]=useState(false);
  const [last5,setLast5]=useState("");
  const [copied,setCopied]=useState(false);
  const [guestName, setGuestName] = useState(existingOrder?.guestName || "");
  const [lines, setLines] = useState(existingOrder?.lines || []);
  const [activeCat, setActiveCat] = useState("brunch");
  const [menuOffMap, setMenuOffMap] = useState({}); // 品項上下架:該日期關閉的品項
  useEffect(()=>{
    FS.loadDoc("menuOff").then(v=>{ if(v) setMenuOffMap(v); });
    const u=FS.subscribeDoc("menuOff", v=>{ if(v) setMenuOffMap(v); });
    return ()=>u&&u();
  },[]);
  const offSet = new Set(menuOffMap[normDate(group.date)]||[]);
  const [seasonMap, setSeasonMap] = useState({}); // 季節品項檔期 {itemId:{from,to}}
  useEffect(()=>{
    FS.loadDoc("menuSeason").then(v=>{ if(v) setSeasonMap(v); });
    const u=FS.subscribeDoc("menuSeason", v=>{ if(v) setSeasonMap(v); });
    return ()=>u&&u();
  },[]);
  // 季節品項:用餐日在檔期內才看得到;沒設定檔期=下架
  const seasonOK = (item) => {
    if(!item.season) return true;
    const w=seasonMap[item.id];
    if(!w||!w.from||!w.to) return false;
    const yr=new Date().getFullYear();
    const p=(x)=>{ const m=normDate(x).split("/"); const mo=+m[0],da=+m[1]; return (mo&&da)?new Date(yr,mo-1,da):null; };
    const d=p(group.date), a=p(w.from), b=p(w.to);
    if(!d||!a||!b) return false;
    return d>=a && d<=b;
  };
  const itemVisible = (item) => !(group.disabledItems||[]).includes(item.id) && !offSet.has(item.id) && seasonOK(item);
  const [drinkModal, setDrinkModal] = useState(null);
  const [setMealToggleLine, setSetMealToggleLine] = useState(null);
  const [setMealPicking, setSetMealPicking] = useState(null);
  const [mainChoicePending, setMainChoicePending] = useState(null);
  const [alaNotice, setAlaNotice] = useState(false); // 單點主餐提醒(每次點餐流程提醒一次)
  const [showAddList, setShowAddList] = useState(false);
  const [itemChoicePending, setItemChoicePending] = useState(null);
  const [step, setStep] = useState(existingOrder ? "menu" : "info");

  const updateLine = (id, updates) => setLines(p => p.map(l => l.id === id ? {...l, ...updates} : l));
  const removeLine = (id) => setLines(p => p.filter(l => l.id !== id));
  const [addToast, setAddToast] = useState(null);
  const addItem = (item) => {
    const newLine = { id: makeLineId(), itemId: item.id, dressing: null, ice: null, sugar: null, mascot: null, setMeal: null };
    if (item.fixedIce) newLine.ice = null;
    setLines(p => [...p, newLine]);
    setAddToast(item.name);
    setTimeout(() => setAddToast(null), 1500);
  };
  const addItemWithOptions = (item, opts) => {
    const newLine = { id: makeLineId(), itemId: item.id, 
      dressing: opts.dressing || null, 
      ice: opts.ice || (item.fixedIce ? null : null), 
      sugar: opts.sugar || null, 
      mascot: opts.mascot || null, 
      toggles: opts.toggles || [],
      setMeal: null };
    setLines(p => [...p, newLine]);
    setAddToast(item.name);
    setTimeout(() => setAddToast(null), 1500);
    setItemChoicePending(null);
  };

  const allComplete = lines.length > 0 && lines.every(lineComplete) &&
    lines.filter(l => isMainDish(findItem(l.itemId))).every(l => !l.setMeal || l.setMeal.drink);

  const total = orderTotal(lines, isMember);
  const myNum = existingOrder?.num || nextNum || (group.orders?.length ?? 0) + 1;
  const hasMain = lines.some(l => isMainDish(findItem(l.itemId)));
  const setTime  = hasMain ? addMinutes(group.time, 30) : null;
  const hasSet   = lines.some(l => l.setMeal);
  const mealTime = hasSet  ? addMinutes(group.time, 20) : null;

  if (step === "info") return (
    <div style={LS.page}>
      <style>{GS}</style>
      {group&&group.date&&(
        <div style={{padding:"10px 14px",background:"#fcefd6",borderBottom:"1px solid #e8cf9a",textAlign:"center"}}>
          <div style={{fontSize:"14px",color:"#9c5a1c",fontWeight:"700"}}>⏰ 點餐截止：{deadlineText(group.date)}</div>
          <div style={{fontSize:"12px",color:"#b07020",marginTop:"2px"}}>逾時系統將自動關閉，無法線上點餐</div>
          <div style={{fontSize:"11px",color:"#9a6a30",marginTop:"3px"}}>※ 國定假日若在週一至週五，截止為用餐前一天12:00</div>
        </div>
      )}
      <div style={{padding:"28px 20px 20px",background:"linear-gradient(180deg,#f3e9da,#fbf6ee)",borderBottom:"1px solid #e6d6bd",textAlign:"center"}}>
        <div style={{fontSize:"13px",color:"#9a6a40",letterSpacing:"0.2em",marginBottom:"8px"}}>✦ 今鶴 JINHER ✦</div>
        <div style={{fontSize:"20px",fontFamily:"'Noto Serif TC',serif",fontWeight:"700",color:"#9c5a1c"}}>{group.name} 的訂位</div>
        <div style={{fontSize:"14px",color:"#8a6a48",marginTop:"4px"}}>{group.date} {group.time} · {group.headcount}</div>
        <div style={{marginTop:"10px",padding:"8px 16px",borderRadius:"10px",display:"inline-block",
          background:group.memberType==="new"?"#e2f4ea":group.memberType==="existing"?"#f6e8d2":"#fdf8ef",
          color:group.memberType==="new"?"#3f8f63":group.memberType==="existing"?"#a86a20":"#8a6e50",
          fontSize:"14px",fontWeight:"700"}}>
          {group.memberType==="existing"?"✦ 會員訂位":group.memberType==="new"?"★ 現場入會（整組$100，點前菜可折抵）":"○ 非會員"}
        </div>
      </div>
      <div style={{padding:"16px",overflowY:"auto",flex:1}}>
        <div style={LS.card}>
          <label style={LS.label}>您的姓名</label>
          <input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="請輸入姓名" style={LS.input}/>
        </div>
        {depNeeded&&(
          <div style={{...LS.card,marginTop:"14px"}}>
            <button onClick={()=>setIsBooker(v=>!v)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",cursor:"pointer",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"18px",fontWeight:"800",color:"#9c5a1c"}}>📌 我是本次訂位人</span>
              <span style={{fontSize:"14px",fontWeight:"800",color:"#fff",background:"#d0742a",borderRadius:"8px",padding:"5px 10px",whiteSpace:"nowrap"}}>{isBooker?"收合 ▲":"需匯款訂金 ▼"}</span>
            </button>
            <div style={{maxHeight:isBooker?"680px":"0",overflow:"hidden",transition:"max-height 0.35s ease"}}>
              <div style={{paddingTop:"12px"}}>
                {depStatus==="已核對"?(
                  <div style={{background:"#e2f4ea",borderRadius:"10px",padding:"16px",textAlign:"center",color:"#3f8f63",fontWeight:"700",fontSize:"15px"}}>✅ 訂金已確認，謝謝！</div>
                ):depStatus==="待核對"?(
                  <div style={{background:"#fcefd6",borderRadius:"10px",padding:"16px",textAlign:"center",color:"#a86a20",fontWeight:"700",fontSize:"14px",lineHeight:"1.6"}}>⏳ 已收到您的末5碼（{group.depositLast5}）<br/>我們核對後會更新狀態</div>
                ):(
                  <div>
                    {(depDaysLeft!=null&&depDaysLeft<0)&&(
                      <div style={{background:"#fbe0e0",border:"1.5px solid #d06060",borderRadius:"10px",padding:"11px 12px",marginBottom:"10px"}}>
                        <div style={{fontSize:"14px",color:"#c02020",fontWeight:"800",lineHeight:"1.6"}}>⚠ 已超過付款期限</div>
                        <div style={{fontSize:"12px",color:"#a03030",marginTop:"2px",lineHeight:"1.6"}}>位置可能無法保留,請<u>立即聯繫店家</u>確認訂位是否還在。</div>
                      </div>
                    )}
                    <div style={{background:"#fff4e0",border:"1px solid #e8b060",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
                      <div style={{fontSize:"16px",color:"#b06010",fontWeight:"700"}}>應付訂金 ${depAmount}</div>
                      <div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>{group.isVip?"包廂 · ":""}{group.headcount} · 每人$100{group.isVip&&depTotal<10?"（包廂最低$1000）":""}</div>
                      {depInfo.lastMinute
                        ? <div style={{fontSize:"14px",color:"#c02020",fontWeight:"800",marginTop:"8px",lineHeight:"1.7",background:"#fce0e0",borderRadius:"8px",padding:"8px 10px"}}>⏰ 您是用餐前一天才訂位,請於<u>訂位後 2 小時內</u>完成付款,否則位置不予保留!</div>
                        : depDeadline&&<div style={{fontSize:"13px",color:"#d05a36",fontWeight:"700",marginTop:"8px",lineHeight:"1.6"}}>⏰ 請於<u>用餐前一天（{depDeadline}）中午 12:00 前</u>匯款完成，逾期視同取消{depDaysLeft!=null&&depDaysLeft>=0?`（還剩 ${depDaysLeft} 天）`:""}。</div>}
                    </div>
                    <div style={{background:"#fdf8ef",border:"1px solid #e6d6bd",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                        <div style={{fontSize:"12px",color:"#8a6e50"}}>匯款帳號</div>
                        <button onClick={()=>{ try{navigator.clipboard.writeText(BANK_INFO.acct.replace(/\D/g,""));}catch(e){} setCopied(true); setTimeout(()=>setCopied(false),1500); }}
                          style={{fontSize:"12px",fontWeight:"800",border:"none",borderRadius:"7px",padding:"5px 12px",cursor:"pointer",background:copied?"#3a8a5a":"#b07840",color:"#fff"}}>{copied?"✓ 已複製":"📋 複製帳號"}</button>
                      </div>
                      <div style={{fontSize:"14px",color:"#3a2a18",fontWeight:"700",lineHeight:"1.7"}}>{BANK_INFO.bank}<br/>戶名：{BANK_INFO.name}<br/>帳號：{BANK_INFO.acct}</div>
                    </div>
                    <div style={{fontSize:"13px",color:"#6a4f38",fontWeight:"700",marginBottom:"6px"}}>付款後請輸入轉帳「帳號末5碼」</div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <input value={last5} onChange={e=>setLast5(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="末5碼" inputMode="numeric"
                        style={{flex:1,background:"#fffdf8",border:"1px solid #d8c2a2",borderRadius:"10px",padding:"12px",color:"#3a2a18",fontSize:"16px"}}/>
                      <button disabled={last5.length<5} onClick={()=>{onUpdateGroup&&onUpdateGroup({depositLast5:last5,depositStatus:"待核對"});}}
                        style={{padding:"12px 20px",borderRadius:"10px",border:"none",background:last5.length<5?"#e6d6bd":"#b07840",color:last5.length<5?"#b8a892":"#fff",fontSize:"15px",fontWeight:"700",cursor:last5.length<5?"default":"pointer"}}>送出</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{padding:"12px 16px 24px"}}>
        <button disabled={!guestName.trim()} onClick={()=>setStep("menu")}
          style={{...LS.primaryBtn,opacity:!guestName.trim()?0.35:1}}>開始點餐 →</button>
        <button onClick={onBack} style={LS.ghostBtn}>← 返回首頁</button>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={{...LS.page,justifyContent:"center",alignItems:"center",textAlign:"center",padding:"24px 20px",overflowY:"auto"}}>
      <style>{GS}</style>
      <div style={{fontSize:"36px",marginBottom:"8px"}}>✦</div>
      <div style={{fontSize:"20px",fontFamily:"'Noto Serif TC',serif",color:"#9c5a1c",marginBottom:"4px"}}>感謝您的點餐！</div>
      <div style={{fontSize:"14px",color:"#6a4f38",marginBottom:"2px"}}>{guestName}</div>
      <div style={{fontSize:"13px",color:"#8a6a48",marginBottom:"12px"}}>{group.name} · {group.date} {group.time}</div>
        {group.date&&!group.locked&&!isPastDeadline(group.date)&&(
          <div style={{fontSize:"13px",color:"#c05a10",marginTop:"4px",fontWeight:"700"}}>⏰ 點餐截止：{deadlineText(group.date)}（逾時自動關閉）</div>
        )}
        {group.date&&!group.locked&&!isPastDeadline(group.date)&&(
          <div style={{fontSize:"11px",color:"#b07020",marginTop:"2px"}}>※ 國定假日若在週一至週五，截止為用餐前一天12:00</div>
        )}
      <div style={{background:"#fbf2e2",border:"2px solid #e0b060",borderRadius:"16px",padding:"12px 32px",marginBottom:"12px"}}>
        <div style={{fontSize:"13px",color:"#8a6a48",marginBottom:"4px"}}>您的號碼</div>
        <div style={{fontSize:"40px",fontWeight:"700",color:"#9c5a1c",fontFamily:"'Noto Serif TC',serif"}}>{myNum}號</div>
        <div style={{fontSize:"12px",color:"#7a5e42",marginTop:"2px"}}>員工將依號碼送餐，請記住</div>
      </div>
      <div style={{background:"#fdf4e8",border:"1px solid #e0cdb0",borderRadius:"14px",padding:"12px 16px",marginBottom:"10px",width:"100%",maxWidth:"300px",textAlign:"left"}}>
        <div style={{fontSize:"13px",color:"#9c5a1c",fontWeight:"700",marginBottom:"6px"}}>送餐方式</div>
        <div style={{fontSize:"13px",color:"#6a4f38",lineHeight:"1.9"}}>現場會用「詢問號碼」的方式送餐，一個號碼對應一個人的餐點。</div>
        <div style={{fontSize:"13px",color:"#8a6a48",marginTop:"6px",background:"#fbf2e2",borderRadius:"8px",padding:"6px 10px"}}>「例如：1號餐是哪位的呢？」</div>
      </div>
      {(mealTime||setTime)&&(
        <div style={{background:"#fdf4e8",border:"1px solid #e0cdb0",borderRadius:"14px",padding:"12px 16px",marginBottom:"10px",width:"100%",maxWidth:"300px",textAlign:"left"}}>
          <div style={{fontSize:"13px",color:"#9c5a1c",fontWeight:"700",marginBottom:"8px"}}>出餐時間</div>
          {mealTime&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}><span style={{fontSize:"13px",color:"#7a5e42"}}>最晚出套餐時間</span><span style={{fontSize:"18px",fontWeight:"700",color:"#9c5a1c"}}>{mealTime}</span></div>}
          {setTime&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"13px",color:"#7a5e42"}}>
              <span style={{color:"#e84040",fontWeight:"900"}}>第一份主餐</span>最晚出餐
            </span>
            <span style={{fontSize:"20px",fontWeight:"900",color:"#e84040"}}>{setTime}</span>
          </div>}
          <div style={{fontSize:"12px",color:"#d05a36",marginTop:"8px",lineHeight:"1.6"}}>請務必準時抵達現場，會依照現場狀況提早出餐，上述是最晚的出餐時間。</div>
        </div>
      )}
      {(()=>{
        const mf = calcMemberFee(lines, group.memberType);
        const subtotal = total + mf.fee;   // 只加入會費,不主動扣折抵
        const withService = Math.round(subtotal * 1.1);
        return (<>
          <div style={{fontSize:"15px",color:"#8a6a48",marginBottom:"2px"}}>小計 ${total}</div>
          {mf.fee>0&&<div style={{fontSize:"13px",color:"#3f8f63",marginBottom:"1px",fontWeight:"700"}}>★ 入會費 +${mf.fee}</div>}
          {mf.fee>0&&<div style={{fontSize:"11px",color:"#b06010",marginBottom:"3px",lineHeight:"1.4"}}>結帳時若有前菜或酒類，折$100</div>}
          <div style={{fontSize:"22px",color:"#9c5a1c",fontWeight:"700",marginBottom:"2px"}}>${withService}</div>
          <div style={{fontSize:"12px",color:"#7a5e42",marginBottom:"16px"}}>含10%服務費 · 請等待服務人員確認</div>
        </>);
      })()}
      {(!group.locked && !existingOrder?.orderLocked) ? (
        <div style={{display:"flex",gap:"8px",width:"100%",maxWidth:"280px",marginBottom:"10px"}}>
          <button onClick={()=>setStep("menu")} style={{...LS.primaryBtn,flex:1,background:"#5a6a8a",fontSize:"14px"}}>✏ 修改</button>
          <button onClick={()=>setStep("add")} style={{...LS.primaryBtn,flex:1,background:"#4a7a5a",fontSize:"14px"}}>+ 加點</button>
        </div>
      ) : (
        <div style={{fontSize:"13px",color:"#d05a36",marginBottom:"10px",padding:"8px 14px",background:"#fcebe4",borderRadius:"8px",maxWidth:"280px"}}>🔒 訂單已鎖定，如需修改請洽服務人員</div>
      )}
      <button onClick={()=>onBack("summary")} style={{...LS.primaryBtn,maxWidth:"280px",margin:"0 auto",marginBottom:"8px",background:"#3a5a7a"}}>📋 查看全組訂單</button>
      <button onClick={onBack} style={{...LS.ghostBtn,maxWidth:"280px",margin:"0 auto"}}>返回首頁</button>
    </div>
  );

  if (step === "add") {
    const addLines = lines.filter(l => !existingOrder?.lines?.find(el => el.id === l.id));
    const allAddComplete = addLines.length > 0 && addLines.every(lineComplete) &&
      addLines.filter(l => isMainDish(findItem(l.itemId))).every(l => !l.setMeal || l.setMeal.drink);

    return (
      <div style={LS.page}>
        <style>{GS}</style>
        <div style={{...LS.header,paddingBottom:"8px"}}>
          <button onClick={()=>setStep("done")} style={LS.backBtn}>← 返回</button>
          <div style={LS.logo}>✦ 加點</div>
          <div style={{fontSize:"12px",color:"#8a6a48"}}>{guestName}</div>
        </div>
        <div style={{display:"flex",overflowX:"auto",padding:"0 12px 10px",gap:"6px"}}>
          {[...FOOD_CATS,...DRINK_CATS].map(k=>(
            <button key={k} onClick={()=>setActiveCat(k)}
              style={{flexShrink:0,padding:"6px 12px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
                background:activeCat===k?"#b07840":"#e6d6bd",color:activeCat===k?"#fff":"#8a6a48"}}>
              {MENU[k].emoji} {MENU[k].label.split(" ").pop().substring(0,5)}
            </button>
          ))}
        </div>
        {MENU[activeCat]?.note&&<div style={{fontSize:"12px",color:"#8a6e50",padding:"3px 14px 5px",background:"#f5ede0"}}>※ {MENU[activeCat].note}</div>}
        {itemChoicePending&&(
          <ItemChoiceModal item={itemChoicePending} isMember={isMember}
            onConfirm={(opts)=>addItemWithOptions(itemChoicePending,opts)}
            onClose={()=>setItemChoicePending(null)}/>
        )}
        {addToast&&(
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            background:"rgba(26,60,26,0.95)",border:"1px solid #3f8f63",borderRadius:"14px",
            padding:"14px 24px",zIndex:500,textAlign:"center",pointerEvents:"none",
            boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:"13px",color:"#3f8f63",marginBottom:"4px"}}>✓ 已加點</div>
            <div style={{fontSize:"15px",color:"#3a2a18",fontWeight:"700",maxWidth:"200px"}}>{addToast}</div>
          </div>
        )}
        <div style={{overflowY:"auto",flex:1,padding:"0 14px 120px"}}>
          {addLines.length>0&&(
            <div style={{marginBottom:"14px"}}>
              <div onClick={()=>setShowAddList(p=>!p)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",cursor:"pointer",
                  background:showAddList?"#e2f2e4":"#dff0e1",borderRadius:"10px",padding:"10px 14px",
                  border:"1.5px solid #7ab87a"}}>
                <div style={{fontSize:"14px",color:"#3f8f63",fontWeight:"700"}}>
                  🛒 已加 {addLines.length} 項 · ${orderTotal(addLines,isMember)}
                </div>
                <div style={{fontSize:"14px",color:"#fff",fontWeight:"700",background:"#7ab87a",borderRadius:"6px",padding:"2px 10px"}}>
                  {showAddList?"▲ 收合":"▼ 查看"}
                </div>
              </div>
              {showAddList&&addLines.map(line=>(
                <LineCard key={line.id} line={line} isMember={isMember}
                  onRemove={()=>removeLine(line.id)}
                  onUpdate={u=>updateLine(line.id,u)}
                  onAddSet={()=>updateLine(line.id,{setMeal:{id:"A",drink:null}})}
                  onChangeSet={()=>{setSetMealPicking(line.id);setDrinkModal(line.id);}}
                />
              ))}
            </div>
          )}
          <div style={{fontSize:"13px",color:"#8a6a48",fontWeight:"700",marginBottom:"8px"}}>繼續選擇</div>
          {MENU[activeCat].items.filter(itemVisible).map(item=>(
            <div key={item.id} onClick={()=>{
              if(isMainDish(item)){
                setMainChoicePending(item);
              } else {
                setItemChoicePending(item);
              }
            }}
              style={{padding:"12px 14px",marginBottom:"7px",borderRadius:"12px",cursor:"pointer",background:"#fffdf8",border:"1px solid #e6d6bd",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:"15px",color:"#4a3826"}}>{item.name}</div>
                {item.sub&&!item.sub.startsWith("⚠")&&<div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>{item.sub}</div>}
              </div>
              <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"700",marginLeft:"8px"}}>+${getItemPrice(item,isMember)}</div>
            </div>
          ))}
        </div>
        {/* Main dish single/set choice popup */}
        {alaNotice&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setAlaNotice(false)}>
            <div style={{background:"#fff",borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"300px",border:"2px solid #d8a24a",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:"30px",marginBottom:"8px"}}>⏳</div>
              <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"800",marginBottom:"8px"}}>小提醒</div>
              <div style={{fontSize:"14px",color:"#5a4530",lineHeight:"1.7",marginBottom:"14px"}}>現場加點會依照<b style={{color:"#c05a10"}}>入單順序</b>排單製作，建議想吃的餐點先一次點齊喔！</div>
              <button onClick={()=>setAlaNotice(false)} style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",background:"#b07840",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>知道了</button>
            </div>
          </div>
        )}
        {mainChoicePending&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setMainChoicePending(null)}>
            <div style={{background:"#ffffff",borderRadius:"20px",padding:"20px",width:"100%",maxWidth:"320px",border:"1px solid #d8c2a2"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:"16px",color:"#9c5a1c",fontWeight:"700",marginBottom:"4px"}}>{mainChoicePending.name}</div>
              <div style={{fontSize:"13px",color:"#8a6e50",marginBottom:"16px"}}>${getItemPrice(mainChoicePending,isMember)} · 請選擇點餐方式</div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <button onClick={()=>{const mi=mainChoicePending;setMainChoicePending(null);setAlaNotice(true);if(mi.toggles&&mi.toggles.length){setItemChoicePending(mi);}else{addItem(mi);}}}
                  style={{padding:"14px",borderRadius:"12px",background:"#fbf0e0",border:"1px solid #d0b48c",color:"#9c5a1c",fontSize:"15px",fontWeight:"700",cursor:"pointer",textAlign:"left"}}>
                  <div>單點</div>
                  <div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>只點主餐 ${getItemPrice(mainChoicePending,isMember)}</div>
                </button>
                {SET_MEALS.map(sm=>(
                  <button key={sm.id} onClick={()=>{
                    const mi2=mainChoicePending;
                    const newLine={id:makeLineId(),itemId:mi2.id,dressing:null,ice:null,sugar:null,mascot:null,toggles:[],setMeal:{id:sm.id,drink:null}};
                    setLines(p=>[...p,newLine]);
                    setAddToast(mi2.name);
                    setTimeout(()=>setAddToast(null),1500);
                    setMainChoicePending(null);
                    if(mi2.toggles&&mi2.toggles.length){
                      setSetMealToggleLine({lineId:newLine.id,item:mi2});
                    } else {
                      setTimeout(()=>{setSetMealPicking(newLine.id);setDrinkModal(newLine.id);},100);
                    }
                  }}
                    style={{padding:"14px",borderRadius:"12px",background:"#eaf6ec",border:"1px solid #bcd8bf",color:"#3f8f63",fontSize:"15px",fontWeight:"700",cursor:"pointer",textAlign:"left"}}>
                    <div>{sm.label}</div>
                    <div style={{fontSize:"12px",color:"#3f8f5a",marginTop:"2px"}}>{sm.desc} · +${sm.price}</div>
                  </button>
                ))}
              </div>
              <button onClick={()=>setMainChoicePending(null)} style={{...LS.ghostBtn,marginTop:"10px",padding:"10px"}}>取消</button>
            </div>
          </div>
        )}
        {setMealToggleLine&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#fdfaf4",borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"320px",border:"1px solid #d0c0a8"}}>
            <div style={{fontSize:"17px",fontWeight:"700",color:"#6a4a2e",marginBottom:"4px",textAlign:"center"}}>{setMealToggleLine.item.name}</div>
            <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"4px",textAlign:"center"}}>特製需求（可複選）</div>
            <div style={{fontSize:"12px",color:"#b07020",marginBottom:"12px",lineHeight:"1.5",textAlign:"center"}}>本道料理為小辣，含白酒風味。<br/>無特殊需求可直接按「下一步」。</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
              {setMealToggleLine.item.toggles.map(t=>{
                const cur=lines.find(l=>l.id===setMealToggleLine.lineId);
                const on=cur&&cur.toggles&&cur.toggles.includes(t);
                return (
                  <button key={t} onClick={()=>{
                    updateLine(setMealToggleLine.lineId,{toggles:on?(cur.toggles||[]).filter(x=>x!==t):[...(cur.toggles||[]),t]});
                  }} style={{flex:1,padding:"13px",borderRadius:"10px",cursor:"pointer",fontSize:"17px",fontWeight:"700",
                    background:on?"#e8920a":"#fff4e0",color:on?"#fff":"#b06010",border:on?"2px solid #e8920a":"2px solid #e8b060"}}>
                    {on?"✓ ":""}{t}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>{
              const lid=setMealToggleLine.lineId;
              setSetMealToggleLine(null);
              setTimeout(()=>{setSetMealPicking(lid);setDrinkModal(lid);},100);
            }} style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",background:"#b07840",color:"#fff",fontSize:"17px",fontWeight:"700",cursor:"pointer"}}>下一步（選飲料）</button>
          </div>
        </div>
      )}
      {setMealPicking&&!drinkModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setSetMealPicking(null)}>
            <div style={{width:"100%",background:"#ffffff",borderRadius:"24px 24px 0 0",padding:"20px 16px 30px",border:"1px solid #d8c2a2"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:"16px",color:"#9c5a1c",fontWeight:"700",marginBottom:"12px"}}>選擇套餐類型</div>
              {SET_MEALS.map(sm=>(
                <div key={sm.id} onClick={()=>{updateLine(setMealPicking,{setMeal:{id:sm.id,drink:null}});setDrinkModal(setMealPicking);}}
                  style={{padding:"12px",marginBottom:"8px",borderRadius:"12px",cursor:"pointer",background:"#fbf0e0",border:"1px solid #e0cdb0"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"700"}}>{sm.label}</div>
                      <div style={{fontSize:"12px",color:"#7a5e42",marginTop:"2px"}}>{sm.desc}</div>
                    </div>
                    <div style={{color:"#9c5a1c",fontWeight:"700"}}>+${sm.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {drinkModal&&<DrinkModal discount={80} itemVisible={itemVisible}
          onSelect={drink=>{updateLine(drinkModal,{setMeal:{...lines.find(l=>l.id===drinkModal)?.setMeal,drink}});setDrinkModal(null);setSetMealPicking(null);}}
          onClose={()=>{setDrinkModal(null);setSetMealPicking(null);}}/>}
        <div style={{position:"sticky",bottom:0,background:"linear-gradient(to top,#fbf6ee 80%,transparent)",padding:"12px 14px 18px"}}>
          {addLines.length===0?(
            <button onClick={()=>setStep("done")} style={{...LS.primaryBtn,background:"#e6d6bd",color:"#8a6e50"}}>返回</button>
          ):!allAddComplete?(
            <button disabled style={{...LS.primaryBtn,opacity:0.4}}>請先完成所有必選項目</button>
          ):(
            <button onClick={()=>{onSubmit({guestName,lines,num:myNum});setStep("done");}} style={{...LS.primaryBtn,background:"#4a7a5a"}}>確認加點 ✓</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={LS.page}>
      <style>{GS}</style>
      <div style={{...LS.header,paddingBottom:"8px"}}>
        <button onClick={()=>lines.length>0?setStep("done"):onBack()} style={LS.backBtn}>← 返回</button>
        <div style={LS.logo}>✦ {step==="menu"&&existingOrder?"修改訂單":"選擇餐點"}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div style={{fontSize:"12px",color:"#8a6a48"}}>{guestName}</div>
          <div style={{fontSize:"9px",color:"#c8b49a"}}>v89</div>
        </div>
      </div>
      <div style={{display:"flex",overflowX:"auto",padding:"0 12px 10px",gap:"6px"}}>
        {[...FOOD_CATS,...DRINK_CATS].map(k=>(
          <button key={k} onClick={()=>setActiveCat(k)}
            style={{flexShrink:0,padding:"6px 12px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",
              background:activeCat===k?"#b07840":"#e6d6bd",color:activeCat===k?"#fff":"#8a6a48"}}>
            {MENU[k].emoji} {MENU[k].label.split(" ").pop().substring(0,5)}
          </button>
        ))}
      </div>
      {MENU[activeCat]?.note&&<div style={{fontSize:"12px",color:"#8a6e50",padding:"3px 14px 5px",background:"#f5ede0"}}>※ {MENU[activeCat].note}</div>}
      <div style={{overflowY:"auto",flex:1,padding:"0 14px 120px"}}>
        {lines.length>0&&(
          <div style={{marginBottom:"14px"}}>
            <div onClick={()=>setShowAddList(p=>!p)}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",cursor:"pointer",
                background:showAddList?"#e2ecf8":"#e8f0fb",borderRadius:"10px",padding:"10px 14px",
                border:"1.5px solid #4a6a8a"}}>
              <div style={{fontSize:"14px",color:"#3a6aa0",fontWeight:"700"}}>
                🧾 已選 {lines.length} 項 · ${total}
              </div>
              <div style={{fontSize:"14px",color:"#fff",fontWeight:"700",background:"#4a6a8a",borderRadius:"6px",padding:"2px 10px"}}>
                {showAddList?"▲ 收合":"▼ 查看"}
              </div>
            </div>
            {showAddList&&lines.map(line=>(
              <LineCard key={line.id} line={line} isMember={isMember}
                onRemove={()=>removeLine(line.id)}
                onUpdate={u=>updateLine(line.id,u)}
                onAddSet={()=>updateLine(line.id,{setMeal:{id:"A",drink:null}})}
                onChangeSet={()=>{setSetMealPicking(line.id);setDrinkModal(line.id);}}
              />
            ))}
          </div>
        )}
        {lines.length>0&&(
          <div style={{fontSize:"14px",color:"#9c5a1c",fontWeight:"700",marginBottom:"8px",padding:"8px 14px",
            background:"#fdf8ef",borderRadius:"10px",border:"1px dashed #d8c2a2",textAlign:"center"}}>
            👇 繼續往下選餐點可加點
          </div>
        )}
        {lines.length===0&&(
          <div style={{fontSize:"13px",color:"#8a6a48",fontWeight:"700",marginBottom:"8px",padding:"0 2px"}}>選擇餐點</div>
        )}
        {MENU[activeCat].items.filter(itemVisible).map(item=>(
          <div key={item.id} onClick={()=>{
              if(isMainDish(item)){
                setMainChoicePending(item);
              } else {
                setItemChoicePending(item);
              }
            }}
            style={{padding:"12px 14px",marginBottom:"7px",borderRadius:"12px",cursor:"pointer",background:"#fffdf8",border:"1px solid #e6d6bd",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"15px",color:"#4a3826"}}>{item.name}</div>
              {item.sub&&!item.sub.startsWith("⚠")&&<div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>{item.sub}</div>}
              {item.sub?.startsWith("⚠")&&<div style={{fontSize:"12px",color:"#a8741e",marginTop:"2px"}}>{item.sub}</div>}
            </div>
            <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"700",marginLeft:"8px"}}>+${getItemPrice(item,isMember)}</div>
          </div>
        ))}
      </div>
      {setMealPicking&&!drinkModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setSetMealPicking(null)}>
          <div style={{width:"100%",background:"#ffffff",borderRadius:"24px 24px 0 0",padding:"20px 16px 30px",border:"1px solid #d8c2a2"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"16px",color:"#9c5a1c",fontWeight:"700",marginBottom:"12px"}}>選擇套餐類型</div>
            {SET_MEALS.map(sm=>(
              <div key={sm.id} onClick={()=>{updateLine(setMealPicking,{setMeal:{id:sm.id,drink:null}});setDrinkModal(setMealPicking);}}
                style={{padding:"12px",marginBottom:"8px",borderRadius:"12px",cursor:"pointer",background:"#fbf0e0",border:"1px solid #e0cdb0"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"700"}}>{sm.label}</div>
                    <div style={{fontSize:"12px",color:"#7a5e42",marginTop:"2px"}}>{sm.desc}</div>
                  </div>
                  <div style={{color:"#9c5a1c",fontWeight:"700"}}>+${sm.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {drinkModal&&<DrinkModal discount={80} itemVisible={itemVisible}
        onSelect={drink=>{
          updateLine(drinkModal,{setMeal:{...lines.find(l=>l.id===drinkModal)?.setMeal,drink}});
          setDrinkModal(null);setSetMealPicking(null);
        }}
        onClose={()=>{setDrinkModal(null);setSetMealPicking(null);}}/>}
      {alaNotice&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setAlaNotice(false)}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"300px",border:"2px solid #d8a24a",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"30px",marginBottom:"8px"}}>⏳</div>
            <div style={{fontSize:"15px",color:"#9c5a1c",fontWeight:"800",marginBottom:"8px"}}>小提醒</div>
            <div style={{fontSize:"14px",color:"#5a4530",lineHeight:"1.7",marginBottom:"14px"}}>現場加點會依照<b style={{color:"#c05a10"}}>入單順序</b>排單製作，建議想吃的餐點先一次點齊喔！</div>
            <button onClick={()=>setAlaNotice(false)} style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",background:"#b07840",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>知道了</button>
          </div>
        </div>
      )}
      {mainChoicePending&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setMainChoicePending(null)}>
          <div style={{background:"#ffffff",borderRadius:"20px",padding:"20px",width:"100%",maxWidth:"320px",border:"1px solid #d8c2a2"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"16px",color:"#9c5a1c",fontWeight:"700",marginBottom:"4px"}}>{mainChoicePending.name}</div>
            <div style={{fontSize:"13px",color:"#8a6e50",marginBottom:"16px"}}>${getItemPrice(mainChoicePending,isMember)} · 請選擇點餐方式</div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <button onClick={()=>{const mi=mainChoicePending;setMainChoicePending(null);setAlaNotice(true);if(mi.toggles&&mi.toggles.length){setItemChoicePending(mi);}else{addItem(mi);}}}
                style={{padding:"14px",borderRadius:"12px",background:"#fbf0e0",border:"1px solid #d0b48c",color:"#9c5a1c",fontSize:"15px",fontWeight:"700",cursor:"pointer",textAlign:"left"}}>
                <div>單點</div>
                <div style={{fontSize:"12px",color:"#8a6e50",marginTop:"2px"}}>只點主餐 ${getItemPrice(mainChoicePending,isMember)}</div>
              </button>
              {SET_MEALS.map(sm=>(
                <button key={sm.id} onClick={()=>{
                  const mi2=mainChoicePending;
                  const newLine={id:makeLineId(),itemId:mi2.id,dressing:null,ice:null,sugar:null,mascot:null,toggles:[],setMeal:{id:sm.id,drink:null}};
                  setLines(p=>[...p,newLine]);
                  setAddToast(mi2.name);
                  setTimeout(()=>setAddToast(null),1500);
                  setMainChoicePending(null);
                  if(mi2.toggles&&mi2.toggles.length){
                    setSetMealToggleLine({lineId:newLine.id,item:mi2});
                  } else {
                    setTimeout(()=>{setSetMealPicking(newLine.id);setDrinkModal(newLine.id);},100);
                  }
                }}
                  style={{padding:"14px",borderRadius:"12px",background:"#eaf6ec",border:"1px solid #bcd8bf",color:"#3f8f63",fontSize:"15px",fontWeight:"700",cursor:"pointer",textAlign:"left"}}>
                  <div>{sm.label}</div>
                  <div style={{fontSize:"12px",color:"#3f8f5a",marginTop:"2px"}}>{sm.desc} · +${sm.price}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setMainChoicePending(null)} style={{...LS.ghostBtn,marginTop:"10px",padding:"10px"}}>取消</button>
          </div>
        </div>
      )}
      {itemChoicePending&&(
        <ItemChoiceModal item={itemChoicePending} isMember={isMember}
          onConfirm={(opts)=>addItemWithOptions(itemChoicePending,opts)}
          onClose={()=>setItemChoicePending(null)}/>
      )}
      {setMealToggleLine&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#fdfaf4",borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"320px",border:"1px solid #d0c0a8"}}>
            <div style={{fontSize:"17px",fontWeight:"700",color:"#6a4a2e",marginBottom:"4px",textAlign:"center"}}>{setMealToggleLine.item.name}</div>
            <div style={{fontSize:"13px",color:"#7a5e42",fontWeight:"700",marginBottom:"4px",textAlign:"center"}}>特製需求（可複選）</div>
            <div style={{fontSize:"12px",color:"#b07020",marginBottom:"12px",lineHeight:"1.5",textAlign:"center"}}>本道料理為小辣，含白酒風味。<br/>無特殊需求可直接按「下一步」。</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
              {setMealToggleLine.item.toggles.map(t=>{
                const cur=lines.find(l=>l.id===setMealToggleLine.lineId);
                const on=cur&&cur.toggles&&cur.toggles.includes(t);
                return (
                  <button key={t} onClick={()=>{
                    updateLine(setMealToggleLine.lineId,{toggles:on?(cur.toggles||[]).filter(x=>x!==t):[...(cur.toggles||[]),t]});
                  }} style={{flex:1,padding:"13px",borderRadius:"10px",cursor:"pointer",fontSize:"17px",fontWeight:"700",
                    background:on?"#e8920a":"#fff4e0",color:on?"#fff":"#b06010",border:on?"2px solid #e8920a":"2px solid #e8b060"}}>
                    {on?"✓ ":""}{t}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>{
              const lid=setMealToggleLine.lineId;
              setSetMealToggleLine(null);
              setTimeout(()=>{setSetMealPicking(lid);setDrinkModal(lid);},100);
            }} style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",background:"#b07840",color:"#fff",fontSize:"17px",fontWeight:"700",cursor:"pointer"}}>下一步（選飲料）</button>
          </div>
        </div>
      )}
      {addToast&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          background:"rgba(26,60,26,0.95)",border:"1px solid #3f8f63",borderRadius:"14px",
          padding:"14px 24px",zIndex:500,textAlign:"center",pointerEvents:"none",
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          <div style={{fontSize:"13px",color:"#3f8f63",marginBottom:"4px"}}>✓ 已加點</div>
          <div style={{fontSize:"15px",color:"#3a2a18",fontWeight:"700",maxWidth:"200px"}}>{addToast}</div>
        </div>
      )}
      {lines.length>0&&(
        <div style={{position:"sticky",bottom:0,background:"linear-gradient(to top,#fbf6ee 80%,transparent)",padding:"12px 14px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}>
            <span style={{fontSize:"14px",color:"#8a6a48"}}>{lines.length} 項 · 小計</span>
            <span style={{fontSize:"15px",color:"#8a6a48"}}>${total}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{fontSize:"14px",color:"#9c5a1c",fontWeight:"700"}}>含10%服務費</span>
            <span style={{fontSize:"18px",color:"#9c5a1c",fontWeight:"700"}}>${Math.round(total*1.1)}</span>
          </div>
          {!allComplete ? (
            <button disabled style={{...LS.primaryBtn,opacity:0.4}}>請先完成所有必選項目</button>
          ) : (
            <button onClick={()=>{onSubmit({guestName,lines,num:myNum});setStep("done");}} style={{...LS.primaryBtn,background:"#4a7a5a"}}>
              {existingOrder?"確認修改 ✓":"送出點餐 ✦"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STAFF PAGE ───────────────────────────────────────────────────────────────

// ─── SIGNATURE MODAL ─────────────────────────────────────────────────────────
function SignatureModal({ group, sigType, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [signed, setSigned] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
  const startDraw = (e) => { e.preventDefault(); setIsDrawing(true); setLastPos(getPos(e, canvasRef.current)); setSigned(true); };
  const draw = (e) => {
    e.preventDefault(); if (!isDrawing) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke();
    setLastPos(pos);
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => { const canvas = canvasRef.current; canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height); setSigned(false); };

  return (
    <div style={{position:"fixed",inset:0,background:"#fff",zIndex:400,display:"flex",flexDirection:"column",userSelect:"none",WebkitUserSelect:"none"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",background:"#f5f0e8"}}>
        <div style={{fontSize:"18px",fontWeight:"700",color:"#3a2a1a",textAlign:"center",marginBottom:"10px"}}>
          {sigType==="staff"?"員工簽名確認":"客人簽名確認"}
        </div>
        <div style={{fontSize:"13px",color:"#5a3a28",lineHeight:"1.9"}}>
          <div><b>姓名：</b>{group.name}　<b>電話：</b>{group.phone}</div>
          <div><b>訂位：</b>{group.date} {group.time}　<b>退還訂金：</b>${group.deposit||"—"}</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"16px",gap:"12px"}}>
        <div style={{fontSize:"14px",color:"#555",textAlign:"center"}}>
          {sigType==="staff"?"員工請在下方簽名：":"請客人在下方簽名確認收到退款："}
        </div>
        <canvas ref={canvasRef} width={800} height={500}
          style={{border:"2px solid #ccc",borderRadius:"12px",background:"#fafafa",touchAction:"none",
            width:"100%",flex:1,display:"block",cursor:"crosshair",userSelect:"none",WebkitUserSelect:"none",
            WebkitTouchCallout:"none"}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw}
          onContextMenu={e=>e.preventDefault()}/>
      </div>
      <div style={{display:"flex",gap:"10px",padding:"16px 20px",borderTop:"1px solid #eee",background:"#f9f9f9"}}>
        <button onClick={clearCanvas} style={{flex:1,padding:"14px",borderRadius:"12px",background:"#f0f0f0",border:"none",fontSize:"15px",cursor:"pointer",fontWeight:"600"}}>清除</button>
        <button onClick={onClose} style={{flex:1,padding:"14px",borderRadius:"12px",background:"#f0f0f0",border:"none",fontSize:"15px",cursor:"pointer",fontWeight:"600"}}>取消</button>
        <button disabled={!signed} onClick={()=>onSave(canvasRef.current.toDataURL("image/png"),sigType)}
          style={{flex:2,padding:"14px",borderRadius:"12px",border:"none",fontSize:"15px",fontWeight:"700",
            background:signed?"#2a7a4a":"#ccc",color:"#fff",cursor:signed?"pointer":"default"}}>確認簽名 ✓</button>
      </div>
    </div>
  );
}


// ─── STATUS CELL ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["已加LINE","已提醒點餐","未接","未KEY-需優先KEY","未KEY-超過1週無法先KEY","已KEY需改單","現場點餐","已封存"];

const DEFAULT_STAFF = ["佩霓","TINA","07","佑庭","大銘"];

function ComplaintPanel({ g, setGroups, groups, walkin }) {
  const list = g.complaints||[];
  const ph = normPhone(g.phone);
  const history = (ph&&groups)?groups.filter(x=>x.id!==g.id&&normPhone(x.phone)===ph&&(x.complaints||[]).length>0)
    .flatMap(x=>(x.complaints||[]).map(c=>({...c,_from:`${x.date||""} ${x.name||""}`}))):[];
  if(ph&&Array.isArray(walkin)) walkin.filter(c=>normPhone(c.phone)===ph).forEach(c=>history.push({...c,_from:"散客"}));
  const del = (idx) => setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,complaints:(x.complaints||[]).filter((_,i2)=>i2!==idx)}));
  if(list.length===0 && history.length===0) return null; // 沒客訴就不佔空間
  const Row = ({it, from, onDel}) => (
    <div style={{background:"#fff",borderRadius:"8px",padding:"8px 10px",marginBottom:"6px",border:"1px solid #eecfc0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
        <span style={{fontSize:"11px",fontWeight:"800",color:"#a04020"}}>📅 {it.date}{from?`　（${from}）`:""}</span>
        {onDel&&<button onClick={onDel} style={{background:"none",border:"1px solid #d4a0a0",borderRadius:"6px",color:"#b05050",fontSize:"10px",cursor:"pointer",padding:"1px 8px"}}>刪</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 8px",fontSize:"11px",color:"#5a4030",lineHeight:"1.5"}}>
        <span style={{color:"#a08070"}}>原因</span><span>{it.reason||"—"}</span>
        <span style={{color:"#a08070"}}>態度</span><span>{it.attitude||"—"}</span>
        <span style={{color:"#a08070"}}>如何調整</span><span>{it.adjust||it.note||"—"}</span>
        <span style={{color:"#a08070"}}>下次招待</span><span style={{color:"#1a6a3a",fontWeight:"700"}}>{it.treat||"—"}</span>
      </div>
    </div>
  );
  return (
    <div style={{padding:"10px 12px",background:"#fdf5f0",borderRadius:"10px",margin:"8px 0",border:"1.5px solid #e0a080"}}>
      <div style={{fontSize:"13px",color:"#a04020",fontWeight:"800",marginBottom:"8px"}}>⚠ 客訴記錄（共 {list.length+history.length} 筆）</div>
      {list.map((it,idx)=><Row key={"c"+idx} it={it} onDel={()=>del(idx)}/>)}
      {history.length>0&&(
        <>
          <div style={{fontSize:"10px",color:"#a04020",fontWeight:"800",margin:"6px 0 5px"}}>📞 同一支電話、其他訂位的客訴</div>
          {history.map((it,idx)=><Row key={"h"+idx} it={it} from={it._from}/>)}
        </>
      )}
      <div style={{fontSize:"10px",color:"#a08070",marginTop:"4px"}}>新增客訴請到「過期訂單 → 客訴與建議」。</div>
    </div>
  );
}
function _ComplaintPanelOld({ g, setGroups, groups }) {
  const [f, setF] = useState({reason:"",attitude:"",adjust:"",treat:""});
  const list = g.complaints||[];
  const ph = normPhone(g.phone);
  const history = (ph&&groups)?groups.filter(x=>x.id!==g.id&&normPhone(x.phone)===ph&&(x.complaints||[]).length>0)
    .flatMap(x=>(x.complaints||[]).map(c=>({...c,_from:`${x.date||""} ${x.name||""}`}))):[];
  const add = () => {
    if(!f.reason.trim()&&!f.attitude.trim()&&!f.adjust.trim()&&!f.treat.trim()) return;
    const now=new Date();
    const date=`${now.getMonth()+1}/${now.getDate()}`;
    setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,complaints:[...(x.complaints||[]),{...f,date}]}));
    setF({reason:"",attitude:"",adjust:"",treat:""});
  };
  const del = (idx) => setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,complaints:(x.complaints||[]).filter((_,i2)=>i2!==idx)}));
  const inp = {flex:1,padding:"7px 10px",borderRadius:"8px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"12px"};
  return (
    <div style={{padding:"10px 12px",background:"#fdf5f0",borderRadius:"10px",margin:"8px 0",border:"1px solid #e0c8b8"}}>
      <div style={{fontSize:"12px",color:"#a05030",fontWeight:"700",marginBottom:"8px"}}>⚠ 客訴記錄（{list.length}）</div>
      {history.length>0&&(
        <div style={{background:"#fce8e0",border:"1px solid #d08060",borderRadius:"8px",padding:"7px 9px",marginBottom:"7px"}}>
          <div style={{fontSize:"10px",color:"#a04020",fontWeight:"800",marginBottom:"3px"}}>📞 同電話過去的客訴（{history.length} 筆,來自其他訂位）</div>
          {history.slice(0,5).map((it,i2)=>(
            <div key={i2} style={{fontSize:"10px",color:"#7a4030",lineHeight:"1.6"}}>{it.date}（{it._from}）原因：{it.reason||"—"}　招待：{it.treat||"—"}</div>
          ))}
        </div>
      )}
      {list.map((it,idx)=>(
        <div key={idx} style={{fontSize:"11px",color:"#6a4a2e",padding:"6px 8px",background:"#fff",borderRadius:"8px",marginBottom:"5px",display:"flex",justifyContent:"space-between",gap:"8px"}}>
          <div style={{lineHeight:"1.6"}}>
            <b>{it.date}</b>　原因：{it.reason||"—"}　態度：{it.attitude||"—"}　如何調整：{it.adjust||it.note||"—"}　下次招待：{it.treat||"—"}
          </div>
          <button onClick={()=>del(idx)} style={{background:"none",border:"1px solid #d4a0a0",borderRadius:"6px",color:"#b05050",fontSize:"10px",cursor:"pointer",padding:"1px 7px",flexShrink:0,alignSelf:"center"}}>刪</button>
        </div>
      ))}
      <div style={{display:"flex",gap:"6px",marginTop:"6px",flexWrap:"wrap"}}>
        <input value={f.reason} onChange={e=>setF(p=>({...p,reason:e.target.value}))} placeholder="原因" style={inp}/>
        <input value={f.attitude} onChange={e=>setF(p=>({...p,attitude:e.target.value}))} placeholder="態度" style={inp}/>
        <input value={f.adjust} onChange={e=>setF(p=>({...p,adjust:e.target.value}))} placeholder="如何調整" style={inp}/>
        <input value={f.treat} onChange={e=>setF(p=>({...p,treat:e.target.value}))} placeholder="下次用餐招待什麼" style={inp}/>
        <button onClick={add} style={{padding:"7px 14px",borderRadius:"8px",border:"none",background:"#b07840",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>新增</button>
      </div>
    </div>
  );
}

// 把照片壓小(避免塞爆資料庫):縮到最寬 1080、JPEG 品質 0.55
function compressImage(file, maxW=1080, quality=0.55){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1, maxW/(img.width||maxW));
        const w=Math.max(1,Math.round((img.width||maxW)*scale)), h=Math.max(1,Math.round((img.height||maxW)*scale));
        const canvas=document.createElement("canvas");
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        try{ resolve(canvas.toDataURL("image/jpeg",quality)); }catch(err){ reject(err); }
      };
      img.onerror=reject;
      img.src=e.target.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

// 封存照片:存在獨立的一筆紀錄(arch_xxx),需要時才載入,點縮圖可放大
function ArchivePhoto({ photoId, size=54 }){
  const [img,setImg]=useState(null);
  const [big,setBig]=useState(false);
  const [err,setErr]=useState(false);
  useEffect(()=>{
    let alive=true;
    if(!photoId){ return; }
    FS.loadDoc(`arch_${photoId}`).then(d=>{ if(alive){ if(d&&d.img) setImg(d.img); else setErr(true); } }).catch(()=>{ if(alive) setErr(true); });
    return ()=>{ alive=false; };
  },[photoId]);
  if(!photoId) return null;
  if(err) return <span style={{fontSize:"10px",color:"#c06030"}}>照片載入失敗</span>;
  if(!img) return <span style={{display:"inline-block",width:size,height:size,borderRadius:"6px",background:"#e8e0d0"}}/>;
  return (
    <>
      <img src={img} onClick={()=>setBig(true)} style={{width:size,height:size,objectFit:"cover",borderRadius:"6px",cursor:"pointer",border:"1px solid #c8b89c"}}/>
      {big&&(
        <div onClick={()=>setBig(false)} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",padding:"12px"}}>
          <img src={img} style={{maxWidth:"100%",maxHeight:"100%",borderRadius:"8px"}}/>
        </div>
      )}
    </>
  );
}

function StatusCell({ g, onSave, groups, setGroups, staffList }) {
  const [open, setOpen] = useState(false);
  const [pickStaff, setPickStaff] = useState(false);
  const [pickArchiveType, setPickArchiveType] = useState(false);
  const [pendingArchiveType, setPendingArchiveType] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const staff = (staffList&&staffList.length>0)?staffList:DEFAULT_STAFF;
  const sl = g.statusLog || {};
  const isPast = isPastMeal(g) && !g.archived && !g.cancelled;

  const [archModal, setArchModal] = useState(false);
  const [cplOpen, setCplOpen] = useState(false); // 過期→客訴與建議
  const [cpl, setCpl] = useState({reason:"",attitude:"",adjust:"",treat:""});
  const [archTime, setArchTime] = useState("");
  const [archPhoto, setArchPhoto] = useState(null);
  const [archBusy, setArchBusy] = useState(false);
  const [archStaffPick, setArchStaffPick] = useState(false);
  const [archPending, setArchPending] = useState(null); // {time, photoId}
  const nowStamp = () => { const d=new Date(); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const openArchive = () => { setArchTime(nowStamp()); setArchPhoto(null); setArchModal(true); };
  const onPickPhoto = async (e) => {
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    setArchBusy(true);
    try{ const c=await compressImage(f); setArchPhoto(c); }catch(err){ window.alert("照片處理失敗，請再試一次"); }
    setArchBusy(false);
    e.target.value="";
  };
  const confirmArchive = async () => {
    setArchBusy(true);
    let photoId=null;
    if(archPhoto){ photoId=`${g.id}_${Date.now()}`; await FS.saveDoc(`arch_${photoId}`, {img:archPhoto}); }
    setArchPending({time:archTime||nowStamp(), photoId});
    setArchBusy(false); setArchModal(false); setArchPhoto(null);
    setArchStaffPick(true); // 接著選夥伴
  };
  const finalizeArchive = (operator) => {
    const snap={id:`${Date.now()}`, time:(archPending&&archPending.time)||nowStamp(), photoId:archPending?archPending.photoId:null, by:operator};
    setGroups(p=>p.map(x=>x.id!==g.id?x:{...x, archived:false, archiveType:"menu", archiveTime:snap.time, archiveBy:operator, archiveSnaps:[...(x.archiveSnaps||[]), snap]}));
    setArchStaffPick(false); setArchPending(null);
  };

  const selectStatus = (status) => {
    setPendingStatus(status);
    setOpen(false);
    if(status === "已封存") {
      setPickArchiveType(true);
    } else if(status === "現場點餐") {
      setPendingArchiveType("onsite");
      setPickStaff(true);
    } else {
      setPendingArchiveType("");
      setPickStaff(true);
    }
  };

  const confirmStatus = (operator) => {
    const now = new Date();
    const date = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    // Handle archived separately
    const isArchive = pendingStatus === "已封存";
    const isOnsite = pendingArchiveType==="onsite";
    const isMissed = pendingStatus === "未接";
    setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,
      statusLog: isOnsite ? {status:"",operator,date} : {status:pendingStatus,operator,date},
      missedCount: isMissed ? ((x.missedCount||0)+1) : x.missedCount,
      missedFirst: isMissed ? (x.missedFirst||Date.now()) : x.missedFirst,
      archived: (isArchive&&pendingArchiveType!=="onsite") ? (pendingArchiveType==="booking" ? true : false) : x.archived,
      onsiteOrder: isOnsite ? true : x.onsiteOrder,
      onsiteBy: isOnsite ? operator : x.onsiteBy,
      onsiteAt: isOnsite ? date : x.onsiteAt,
      archiveType: (isArchive&&pendingArchiveType!=="onsite") ? pendingArchiveType : x.archiveType,
      keyed: pendingStatus==="已KEY需改單" ? true : x.keyed,
      menuReminded: pendingStatus==="已提醒點餐" ? true : x.menuReminded,
    }));
    setPickStaff(false);
    setPendingStatus("");
  };

  return (
    <div style={{position:"relative",minWidth:"80px",overflow:"visible"}}>
      {open&&<div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setOpen(false)}/>}
      <div onClick={(e)=>{e.stopPropagation();if(isPast)return;setOpen(p=>!p);}} style={{cursor:isPast?"default":"pointer",textAlign:"center"}}>
        {isPast ? (
          <div>
            {sl.status&&<div style={{fontSize:"10px",color:"#9a8a76",marginBottom:"3px"}}>{sl.status}</div>}
            <button onClick={(e)=>{e.stopPropagation();setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,archived:true,archiveType:"booking"}));}}
              style={{fontSize:"12px",background:"#8a6a4a",color:"#fff",border:"none",borderRadius:"6px",padding:"6px 12px",marginTop:"2px",fontWeight:"700",cursor:"pointer",display:"block",width:"100%"}}>直接封存</button>
            <button onClick={(e)=>{e.stopPropagation();setCpl({reason:"",attitude:"",adjust:"",treat:""});setCplOpen(true);}}
              style={{fontSize:"12px",background:"#a05030",color:"#fff",border:"none",borderRadius:"6px",padding:"6px 12px",marginTop:"4px",fontWeight:"700",cursor:"pointer",display:"block",width:"100%"}}>客訴與建議</button>
            {cplOpen&&createPortal(
              <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",padding:"16px"}} onClick={(e)=>{e.stopPropagation();setCplOpen(false);}}>
                <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"420px",textAlign:"left",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:"17px",color:"#a05030",fontWeight:"800",marginBottom:"3px"}}>⚠ 客訴與建議</div>
                  <div style={{fontSize:"12px",color:"#7a5c3e",marginBottom:"14px"}}>{g.name}（{g.date} {g.time}）— 記錄後會跟著這支電話,下次訂位自動提醒</div>
                  {[["原因","reason"],["態度","attitude"],["如何調整","adjust"],["下次用餐招待什麼","treat"]].map(([l,k])=>(
                    <div key={k} style={{marginBottom:"12px"}}>
                      <div style={{fontSize:"12px",color:"#5a3a28",marginBottom:"5px",fontWeight:"700"}}>{l}</div>
                      <textarea value={cpl[k]} onChange={e=>setCpl(p=>({...p,[k]:e.target.value}))} rows={2}
                        style={{width:"100%",boxSizing:"border-box",padding:"11px 12px",borderRadius:"10px",border:"1.5px solid #c9a45c",background:"#fff",color:"#2e2010",fontSize:"15px",lineHeight:"1.5",resize:"vertical",fontFamily:"inherit"}}/>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:"8px",marginTop:"6px"}}>
                    <button onClick={()=>setCplOpen(false)} style={{flex:1,padding:"13px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>取消</button>
                    <button onClick={()=>{
                        const now=new Date(); const date=`${now.getMonth()+1}/${now.getDate()}`;
                        const hasContent=cpl.reason.trim()||cpl.attitude.trim()||cpl.adjust.trim()||cpl.treat.trim();
                        setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,
                          complaints: hasContent?[...(x.complaints||[]),{...cpl,date}]:(x.complaints||[]),
                          archived:true, archiveType:"booking"}));
                        setCplOpen(false);
                      }}
                      style={{flex:2,padding:"13px",borderRadius:"10px",background:"#a05030",border:"none",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer"}}>記錄並封存</button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        ) : g.archiveType==="menu" ? (
          <div>
            <div style={{fontSize:"12px",color:"#8a5aa8",fontWeight:"800",marginBottom:"2px"}}>📦 餐點已封存</div>
            {g.archiveTime&&<div style={{fontSize:"9px",color:"#7a5c3e",marginBottom:"1px"}}>🕒 {g.archiveTime}</div>}
            {g.archiveBy&&<div style={{fontSize:"9px",color:"#7a5c3e",marginBottom:"3px"}}>👤 {g.archiveBy}</div>}
            {(g.archiveSnaps||[]).filter(s=>s.photoId).length>0 && (()=>{
              const snaps=(g.archiveSnaps||[]).filter(s=>s.photoId);
              const last=snaps[snaps.length-1];
              return (
                <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"4px"}}>
                  <ArchivePhoto photoId={last.photoId} size={46}/>
                  {snaps.length>1 && <span style={{fontSize:"8px",color:"#9a8a76"}}>+{snaps.length-1}張</span>}
                </div>
              );
            })()}
          </div>
        ) : sl.status ? (
          <div>
            <div style={{fontSize:"13px",
              color:sl.status==="未KEY-需優先KEY"?"#ff6060":(sl.status==="未接"?"#c06030":"#d8c8b0"),
              fontWeight:"700",
              background:sl.status==="未KEY-需優先KEY"?"#ffd0d0":"transparent",
              borderRadius:"4px",padding:sl.status==="未KEY-需優先KEY"?"2px 4px":"0"
            }}>{sl.status}{sl.status==="未接"&&g.missedCount>1?` ×${g.missedCount}`:""}</div>
            <div style={{fontSize:"9px",color:"#7a5c3e"}}>{sl.operator} {sl.date}</div>
            {sl.status==="未接"&&(g.missedCount>=3||missedOverdue(g))&&(
              <div style={{fontSize:"9px",color:"#fff",background:"#c0302a",borderRadius:"4px",padding:"1px 4px",marginTop:"2px",fontWeight:"700"}}>⚠ 聯絡不上</div>
            )}
            {g.fromMai&&(
              <button onClick={(e)=>{e.stopPropagation();setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,fromMai:false}));}}
                style={{marginTop:"3px",fontSize:"9px",background:"#b07840",color:"#fff",border:"none",borderRadius:"4px",padding:"2px 6px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>📥 轉一般→</button>
            )}
          </div>
        ) : g.fromMai ? (
            <div style={{marginTop:"2px",display:"flex",flexDirection:"column",gap:"2px",alignItems:"center"}}>
              <div style={{fontSize:"9px",background:"#1a5a3a",color:"#1a6a3a",borderRadius:"4px",padding:"1px 4px",fontWeight:"700"}}>📥麥訂</div>
              <button onClick={(e)=>{e.stopPropagation();const now=new Date();const d=`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,fromMai:false,statusLog:{status:"已加LINE",operator:"",date:d}}));}}
                style={{fontSize:"9px",background:"#b07840",color:"#fff",border:"none",borderRadius:"4px",padding:"2px 6px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>轉一般→</button>
            </div>
          ) : g.onsiteOrder ? (
            <div>
              <div style={{fontSize:"11px",background:"#f5e2c0",color:"#8a5210",borderRadius:"4px",padding:"2px 6px",marginTop:"2px",fontWeight:"700",display:"inline-block"}}>🍽 現點</div>
              {(g.onsiteBy||g.onsiteAt)&&<div style={{fontSize:"9px",color:"#7a5c3e",marginTop:"2px"}}>{g.onsiteBy} {g.onsiteAt}</div>}
            </div>
          ) : (
          <div style={{fontSize:"13px",color:"#9a8a76"}}>選擇狀態</div>
        )}
      </div>
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setOpen(false)}>
          <div style={{background:"#f0e8d8",border:"1px solid #d0c0a8",borderRadius:"14px",padding:"10px",width:"100%",maxWidth:"300px",boxShadow:"0 10px 36px rgba(0,0,0,0.45)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",textAlign:"center",padding:"4px 0 10px"}}>選擇點餐狀態</div>
            {STATUS_OPTIONS.map(s=>(
              <div key={s} onClick={(e)=>{e.stopPropagation();selectStatus(s);}}
                style={{padding:"13px 14px",cursor:"pointer",fontSize:"15px",borderRadius:"8px",marginBottom:"2px",
                  color:s==="未KEY-需優先KEY"?"#ff6060":"#8a5210",
                  background:sl.status===s?"#ede2d0":"#fbf6ec"}}>
                {s==="未KEY-需優先KEY"?"🔴 "+s:s}
              </div>
            ))}
            <div onClick={()=>{onSave(g.id,"statusLog",{status:"",operator:"",date:""});setOpen(false);}}
              style={{padding:"11px 14px",cursor:"pointer",fontSize:"14px",color:"#7a3030",borderTop:"1px solid #d0c0a8",marginTop:"6px",textAlign:"center",fontWeight:"700"}}>
              清除狀態
            </div>
          </div>
        </div>
      )}
      {pickArchiveType&&createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#f0e8d8",borderRadius:"16px",padding:"20px",width:"280px",border:"1px solid #d0c0a8",textAlign:"center"}}>
            <div style={{fontSize:"15px",color:"#8a5210",fontWeight:"700",marginBottom:"8px"}}>選擇封存類型</div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"12px"}}>
              <button onClick={()=>{setPendingArchiveType("booking");setPickArchiveType(false);setPickStaff(true);}}
                style={{padding:"14px",borderRadius:"12px",background:"#dfeadf",border:"1px solid #7ab87a",color:"#2a7a4a",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
                📁 訂位封存
                <div style={{fontSize:"13px",color:"#4a7a4a",marginTop:"4px"}}>整組訂位結束，隱藏表格</div>
              </button>
              <button onClick={()=>{setPickArchiveType(false);openArchive();}}
                style={{padding:"14px",borderRadius:"12px",background:"#e8e8f8",border:"1px solid #a0a0d0",color:"#5a5aa8",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
                🖨 餐點封存（可拍照）
                <div style={{fontSize:"13px",color:"#6a6aaa",marginTop:"4px"}}>已KEY需改單，訂單留在表上、附POS照片</div>
              </button>
              <button onClick={()=>{setPendingArchiveType("onsite");setPickArchiveType(false);setPickStaff(true);}}
                style={{padding:"14px",borderRadius:"12px",background:"#f5ead8",border:"1px solid #8a6a4a",color:"#8a5a20",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
                🍽 標記現場點餐
                <div style={{fontSize:"13px",color:"#aa8a6a",marginTop:"4px"}}>顯示「現點」，不隱藏，需手動封存</div>
              </button>
            </div>
            <button onClick={()=>{setPickArchiveType(false);setPendingStatus("");}}
              style={{width:"100%",padding:"9px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"13px",cursor:"pointer"}}>取消</button>
          </div>
        </div>
      ,document.body)}
      {pickStaff&&createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#f0e8d8",borderRadius:"16px",padding:"20px",width:"260px",border:"1px solid #d0c0a8"}}>
            <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"4px"}}>{pendingStatus}</div>
            <div style={{fontSize:"13px",color:"#7a5c3e",marginBottom:"12px"}}>選擇操作人員</div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {staff.map(name=>(
                <button key={name} onClick={()=>confirmStatus(name)}
                  style={{padding:"10px",borderRadius:"10px",background:"#ede2d0",border:"1px solid #d0c0a8",color:"#8a5210",fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>
                  {name}
                </button>
              ))}
            </div>
            <button onClick={()=>{setPickStaff(false);setPendingStatus("");}}
              style={{width:"100%",padding:"9px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"13px",cursor:"pointer",marginTop:"10px"}}>
              取消
            </button>
          </div>
        </div>
      ,document.body)}
      {archModal&&createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>!archBusy&&setArchModal(false)}>
          <div style={{background:"#f0e8d8",borderRadius:"16px",padding:"18px",width:"100%",maxWidth:"320px",border:"1px solid #d0c0a8"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"15px",color:"#8a5210",fontWeight:"700",marginBottom:"3px"}}>📦 封存這筆訂單</div>
            <div style={{fontSize:"11px",color:"#9a7c5a",marginBottom:"12px"}}>{g.name}（{g.date} {g.time}）</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",fontWeight:"700",marginBottom:"4px"}}>封存日期時間</div>
            <input value={archTime} onChange={e=>setArchTime(e.target.value)} placeholder="2026/06/28 20:21"
              style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#fff",color:"#5a3a28",fontSize:"14px",marginBottom:"4px",boxSizing:"border-box"}}/>
            <div style={{fontSize:"11px",color:"#c06030",marginBottom:"12px",fontWeight:"700"}}>⚠ 請改成「POS 照片上」的時間，不是現在時間</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",fontWeight:"700",marginBottom:"6px"}}>POS 照片（選填）</div>
            {archPhoto ? (
              <div style={{position:"relative",marginBottom:"12px"}}>
                <img src={archPhoto} style={{width:"100%",borderRadius:"8px",border:"1px solid #d0c0a8"}}/>
                <button onClick={()=>setArchPhoto(null)} style={{position:"absolute",top:"6px",right:"6px",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 8px",fontSize:"12px",cursor:"pointer"}}>移除</button>
              </div>
            ) : (
              <label style={{display:"block",textAlign:"center",padding:"14px",borderRadius:"8px",border:"1.5px dashed #c0a880",background:"#faf4e8",color:"#9a6a30",fontSize:"13px",fontWeight:"700",cursor:"pointer",marginBottom:"12px"}}>
                📷 拍照 / 選照片
                <input type="file" accept="image/*" onChange={onPickPhoto} style={{display:"none"}}/>
              </label>
            )}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setArchModal(false)} disabled={archBusy}
                style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>取消</button>
              <button onClick={confirmArchive} disabled={archBusy}
                style={{flex:2,padding:"11px",borderRadius:"10px",background:archBusy?"#b0a088":"#8a6a4a",border:"none",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:archBusy?"default":"pointer"}}>{archBusy?"處理中…":"確認封存 →"}</button>
            </div>
          </div>
        </div>
      ,document.body)}
      {archStaffPick&&<StaffPicker staffList={staffList} onSelect={n=>finalizeArchive(n)} onClose={()=>{setArchStaffPick(false);setArchPending(null);}}/>}
    </div>
  );
}



// ─── COLLECTOR CELL ──────────────────────────────────────────────────────────
function CollectorCell({ g, onSave }) {
  const [open, setOpen] = useState(false);
  const collector = g.collector || "";
  return (
    <div style={{position:"relative",textAlign:"center"}}>
      {open&&<div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setOpen(false)}/>}
      <div onClick={(e)=>{e.stopPropagation();setOpen(p=>!p);}} style={{cursor:"pointer",fontSize:"13px",color:collector?"#8a5210":"#d8c8b0",padding:"2px 4px"}}>
        {collector||"選擇"}
      </div>
      {open&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:300,background:"#f0e8d8",border:"1px solid #d0c0a8",borderRadius:"10px",padding:"6px",minWidth:"100px",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          {DEFAULT_STAFF.map(name=>(
            <div key={name} onClick={()=>{onSave(g.id,"collector",name);setOpen(false);}}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:"13px",color:"#8a5210",borderRadius:"6px",background:collector===name?"#ede2d0":"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.background="#ede2d0"}
              onMouseLeave={e=>e.currentTarget.style.background=collector===name?"#ede2d0":"transparent"}>
              {name}
            </div>
          ))}
          <div onClick={()=>{onSave(g.id,"collector","");setOpen(false);}}
            style={{padding:"6px 12px",cursor:"pointer",fontSize:"13px",color:"#7a3030",borderTop:"1px solid #d8c8b0",marginTop:"4px"}}>清除</div>
        </div>
      )}
    </div>
  );
}





const BLANK_G = {name:"",phone:"",date:"",time:"",headcount:"",bookDate:"",deposit:"",depositDate:"",collector:"",
  lineNotified:false,menuReminded:false,keyed:false,archived:false,cancelled:false,refundSigned:false,
  note:"",code:"",orders:[],memberType:"",disabledItems:[],locked:false,isVip:false};

const DEMO = [
  {...BLANK_G,id:"g1",name:"陳's",phone:"0903667068",date:"11/5",time:"11:00",headcount:"12p1s1c",bookDate:"11/1",deposit:"1400",depositDate:"現 11/3",collector:"NI",lineNotified:true,code:"112",memberType:"existing",orders:[]},
  {...BLANK_G,id:"g2",name:"廖's",phone:"0912629294",date:"4/29",time:"18:30",headcount:"7p",bookDate:"4/16",deposit:"2400",depositDate:"4/14",code:"287",memberType:"none",orders:[]},
  {...BLANK_G,id:"g3",name:"謝's",phone:"0918524568",date:"5/3", time:"12:30",headcount:"6p2c",code:"394",memberType:"new",orders:[]},
];


function HeadcountCell({ g, onSave, setGroups }) {
  const [open, setOpen] = useState(false);
  const h = (g.headcount||"").toLowerCase();
  const a = parseInt((h.match(/(\d+)p/)||[])[1])||0;
  const ch = parseInt((h.match(/(\d+)c/)||[])[1])||0;
  const s = parseInt((h.match(/(\d+)s/)||[])[1])||0;
  const [eA,setEA]=useState(String(a||""));
  const [eC,setEC]=useState(String(ch||""));
  const [eS,setES]=useState(String(s||""));
  const openEdit=()=>{ setEA(String(a||""));setEC(String(ch||""));setES(String(s||""));setOpen(true); };
  const saveHC=()=>{
    const pa=parseInt(eA)||0,pc=parseInt(eC)||0,ps=parseInt(eS)||0;
    const hc=[pa>0?pa+"p":"",pc>0?pc+"c":"",ps>0?ps+"s":""].filter(Boolean).join("");
    onSave(g.id,"headcount",hc);
    setOpen(false);
  };
  const toggleVip=()=>setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,isVip:!x.isVip}));
  return (
    <div style={{display:"flex",alignItems:"center",gap:"4px",justifyContent:"center"}}>
      <div onClick={openEdit} style={{cursor:"pointer",fontSize:"14px",color:"#2e2010",fontWeight:"600"}}>
        {g.headcount||"—"}
      </div>
      <div onClick={toggleVip} title="包廂"
        style={{cursor:"pointer",fontSize:"9px",fontWeight:"700",borderRadius:"5px",padding:"1px 5px",
          background:g.isVip?"#8a5ab4":"#e0d5c0",color:g.isVip?"#fff":"#9a8a76"}}>
        {g.isVip?"包廂":"包"}
      </div>
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)"}} onClick={()=>setOpen(false)}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"18px",width:"260px"}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>修改人數</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
              <div style={{flex:2}}>
                <div style={{fontSize:"10px",color:"#7a5c3e",marginBottom:"3px",textAlign:"center"}}>大人 P</div>
                <input type="number" autoFocus value={eA} onChange={e=>setEA(e.target.value)}
                  style={{width:"100%",padding:"10px 4px",fontSize:"18px",fontWeight:"700",textAlign:"center",border:"1.5px solid #c8b89c",borderRadius:"10px",background:"#fff",color:"#2e2010"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:"10px",color:"#7a5c3e",marginBottom:"3px",textAlign:"center"}}>兒童椅 C</div>
                <select value={eC} onChange={e=>setEC(e.target.value)} style={{width:"100%",padding:"10px 2px",fontSize:"15px",textAlign:"center",border:"1.5px solid #c8b89c",borderRadius:"10px",background:"#fff",color:"#2e2010"}}>
                  {["",0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:"10px",color:"#7a5c3e",marginBottom:"3px",textAlign:"center"}}>餐具 S</div>
                <select value={eS} onChange={e=>setES(e.target.value)} style={{width:"100%",padding:"10px 2px",fontSize:"15px",textAlign:"center",border:"1.5px solid #c8b89c",borderRadius:"10px",background:"#fff",color:"#2e2010"}}>
                  {["",0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button onClick={saveHC} style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>確認</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 固定國曆國定假日(每年同一天,自動適用)
const FIXED_HOLIDAYS = ["1/1","2/28","4/4","4/5","5/1","10/10","10/25","12/25"];
// 農曆假日(每年不同)由後台維護,存在 window.__customHolidays
function isHoliday(meal){
  const k=`${meal.getMonth()+1}/${meal.getDate()}`;
  if(FIXED_HOLIDAYS.includes(k)) return true;
  const custom = (typeof window!=="undefined" && window.__customHolidays) || [];
  return custom.includes(k);
}
function getOrderDeadline(dateStr) {
  // dateStr "M/D" → 回傳截止 Date 或 null
  if(!dateStr) return null;
  const parts=dateStr.split("/"); if(parts.length<2) return null;
  const m=parseInt(parts[0]), d=parseInt(parts[1]);
  if(!m||!d) return null;
  const now=new Date();
  let yr=now.getFullYear();
  let meal=new Date(yr,m-1,d);
  if(meal < new Date(now.getFullYear(),now.getMonth(),now.getDate()-180)) meal=new Date(yr+1,m-1,d);
  const dow=meal.getDay(); // 0=日 1=一 ... 6=六
  let deadline=new Date(meal);
  if(isHoliday(meal)){ // 國定假日視為平日:前一天12:00
    deadline.setDate(meal.getDate()-1);
  } else if(dow>=2&&dow<=5){ // 週二~五:前一天12:00
    deadline.setDate(meal.getDate()-1);
  } else if(dow===6||dow===0){ // 週六、日:該週週五12:00
    const back=dow===6?1:2;
    deadline.setDate(meal.getDate()-back);
  } else if(dow===1){ // 週一:前一天(週日)12:00
    deadline.setDate(meal.getDate()-1);
  }
  deadline.setHours(12,0,0,0);
  return deadline;
}
function deadlineText(dateStr){
  const dl=getOrderDeadline(dateStr);
  if(!dl) return "";
  return `${dl.getMonth()+1}月${dl.getDate()}日 中午12:00`;
}
function isPastDeadline(dateStr) {
  const dl=getOrderDeadline(dateStr);
  if(!dl) return false;
  return new Date() > dl;
}

function getDishSeries(name){
  if(!name) return null;
  // 先用 MENU 比對(找得到品項就用其分類)
  for(const catKey in MENU){
    const cat=MENU[catKey];
    if(cat.items&&cat.items.some(it=>it.name&&(name===it.name||name.includes(it.name)||it.name.includes(name)))){
      return cat.label;
    }
  }
  // 關鍵字後備(換菜單下架的舊品項)
  if(name.includes("義大利麵")||name.includes("麵")) return "Pasta 義大利麵";
  if(name.includes("沙拉")) return "Salad 沙拉";
  if(name.includes("燉飯")) return "Risotto 燉飯";
  if(name.includes("披薩")||name.includes("Pizza")) return "Pizza 披薩";
  if(name.includes("早午餐")) return "Brunch 早午餐";
  return null;
}
// 日期正規化 → 一律變成「月/日」(去年份、全形轉半形、- 或 / 都通),讓上下架日期跟訂位日期一定對得上
function normDate(s){
  let t=(s||"").toString().trim();
  t=t.replace(/[０-９]/g,d=>"０１２３４５６７８９".indexOf(d)+"");     // 全形數字→半形
  t=t.replace(/[／．。\-]/g,"/");                                      // 各種分隔符→/
  const parts=t.split("/").map(x=>x.trim()).filter(x=>x!=="");
  if(parts.length>=2){
    const mo=parseInt(parts[parts.length-2],10), da=parseInt(parts[parts.length-1],10);
    if(!isNaN(mo)&&!isNaN(da)) return `${mo}/${da}`;
  }
  return t.replace(/^0+/,"");
}

// 電話正規化:去掉空格/破折號等,+886→0,只留數字(讓大麥匯入跟手打的比對得上)
function normPhone(s){
  let d=(s||"").replace(/\D/g,"");
  if(d.startsWith("886")) d="0"+d.slice(3);
  return d;
}

function isPastMeal(g){
  if(!g.date) return false;
  const parts=g.date.split("/").map(Number); const m=parts[0],d=parts[1];
  if(!m||!d) return false;
  const today=new Date(); today.setHours(0,0,0,0);
  let meal=new Date(today.getFullYear(),m-1,d);
  if(meal<new Date(today.getFullYear(),today.getMonth()-2,today.getDate())) meal=new Date(today.getFullYear()+1,m-1,d);
  return meal<today;
}

function missedOverdue(g){
  if(!g.missedFirst) return false;
  return (Date.now() - g.missedFirst) > 1000*60*60*24*2; // 第一次未接超過2天仍聯絡不上
}

function needsDeposit(headcount, isVip=false) {
  if(isVip) return true;
  const hc = (headcount||"").toLowerCase();
  const pM=hc.match(/(\d+)p/); const p=pM?parseInt(pM[1]):0;
  const cM=hc.match(/(\d+)c/); const cc=cM?parseInt(cM[1]):0;
  const sM=hc.match(/(\d+)s/); const s=sM?parseInt(sM[1]):0;
  const total = p+cc+s || parseInt(hc) || 0;
  return total >= 10;
}

function makeCode(existing=[]) {
  let c; do { c=String(Math.floor(100+Math.random()*900)); } while(existing.includes(c));
  return c;
}

function daysSinceBook(bookDate) {
  const m = (bookDate||"").trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const now=new Date(); now.setHours(0,0,0,0);
  const d=new Date(now.getFullYear(),parseInt(m[1])-1,parseInt(m[2]));
  return Math.floor((now-d)/86400000);
}

// 訂金截止:一般=用餐前1天12:00;用餐前1天才訂位=訂位後2小時內(lastMinute)
function depDeadlineOf(g){
  const yr=new Date().getFullYear();
  const mm=(g.date||"").match(/^(\d{1,2})\/(\d{1,2})$/);
  const bm=(g.bookDate||"").match(/^(\d{1,2})\/(\d{1,2})$/);
  if(!mm) return null;
  const meal=new Date(yr,+mm[1]-1,+mm[2]);
  const dayBefore=new Date(meal); dayBefore.setDate(meal.getDate()-1);
  let lastMinute=false;
  if(bm){ const book=new Date(yr,+bm[1]-1,+bm[2]); lastMinute=Math.round((meal-book)/86400000)<=1; }
  return {meal,dayBefore,lastMinute,label:`${dayBefore.getMonth()+1}/${dayBefore.getDate()} 12:00`};
}

function depositUrgency(g) {
  if (g.deposit||g.cancelled||g.archived||g.depositLast5||g.depositStatus==="已核對"||g.depositStatus==="待核對") return null;
  const hc=(g.headcount||"").toLowerCase();
  const num=parseInt(hc);
  if (!((num>=10)||hc.includes("包廂")||hc.includes("vip"))) return null;
  const dd=depDeadlineOf(g);
  if(!dd){ const days=daysSinceBook(g.bookDate); if(days===null)return null; if(days>=3)return"overdue"; if(days>=1)return"urgent"; return null; }
  if(dd.lastMinute) return "urgent";      // 前1天才訂位,2小時內付款,一律緊急
  const now=new Date(); now.setHours(0,0,0,0);
  const db=new Date(dd.dayBefore); db.setHours(0,0,0,0);
  const diff=Math.round((db-now)/86400000);
  if(diff<0) return "overdue";            // 已過用餐前1天中午
  if(diff<=1) return "urgent";            // 剩1天內
  return null;
}

function EditCell({g,field,w,onSave}) {
  const [v,setV]=useState(g[field]||"");
  useEffect(()=>setV(g[field]||""),[g[field]]);
  return <input value={v} onChange={e=>setV(e.target.value)} onBlur={()=>onSave(g.id,field,v)}
    style={{width:w,background:"transparent",border:"none",borderBottom:"1px solid #c8b89c",color:"#4a3520",
      fontSize:"13px",padding:"2px 3px",fontFamily:"'Noto Sans TC',sans-serif",outline:"none",minWidth:0}}/>;
}

// ─── 品項上下架(按日期關閉餐點,客人該日點不到) ─────────────────────────────
function ItemsOffPage({ onBack }) {
  const today=new Date();
  const [data,setData]=useState({});           // {"7/12":["p7",...]}
  const [date,setDate]=useState(`${today.getMonth()+1}/${today.getDate()}`);
  const [dateEnd,setDateEnd]=useState("");      // 空=只關單日;有值=關到這天(區間)
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("pasta");
  const [sData,setSData]=useState({});          // 季節檔期 {itemId:{from,to}}
  const [sFrom,setSFrom]=useState("");
  const [sTo,setSTo]=useState("");
  useEffect(()=>{
    FS.loadDoc("menuOff").then(v=>{ if(v) setData(v); });
    const u=FS.subscribeDoc("menuOff", v=>{ if(v) setData(v); });
    FS.loadDoc("menuSeason").then(v=>{ if(v) setSData(v); });
    const u2=FS.subscribeDoc("menuSeason", v=>{ if(v) setSData(v); });
    return ()=>{ u&&u(); u2&&u2(); };
  },[]);
  const dkey=normDate(date);
  // 依「起~迄」列出要套用的所有日期(M/D)。跨月用今年年份推算,最多 90 天防呆
  const rangeKeys=(()=>{
    if(!dateEnd.trim()) return [dkey];
    const yr=today.getFullYear();
    const p=(s)=>{ const [m,d]=normDate(s).split("/").map(n=>parseInt(n,10)); return (isNaN(m)||isNaN(d))?null:new Date(yr,m-1,d); };
    let a=p(date), b=p(dateEnd);
    if(!a||!b) return [dkey];
    if(b<a){ const t=a; a=b; b=t; }
    const out=[]; const cur=new Date(a);
    for(let i=0;i<90 && cur<=b;i++){ out.push(`${cur.getMonth()+1}/${cur.getDate()}`); cur.setDate(cur.getDate()+1); }
    return out;
  })();
  const offList=data[dkey]||[];
  const offSet=new Set(offList);
  const saveData=(nd)=>{ setData(nd); FS.saveDoc("menuOff",nd); };
  const toggle=(id)=>{
    const willClose=!offSet.has(id);   // 依起始日的狀態決定整段要關還是開
    const nd={...data};
    rangeKeys.forEach(k=>{
      const cur=new Set(nd[k]||[]);
      willClose?cur.add(id):cur.delete(id);
      if(cur.size===0) delete nd[k]; else nd[k]=[...cur];
    });
    saveData(nd);
  };
  const allItems=[...FOOD_CATS,...DRINK_CATS].flatMap(c=>(MENU[c]?.items||[]).map(i=>({...i,_cat:c,_catLabel:MENU[c].label||c})));
  const results=q.trim()?allItems.filter(i=>i.name.includes(q.trim())):[];
  const dates=Object.keys(data).filter(k=>Array.isArray(data[k])&&data[k].length>0);
  const chip=(on)=>({padding:"6px 12px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"700",cursor:"pointer",background:on?"#b07840":"#efe6d4",color:on?"#fff":"#6a4a2e"});
  const ItemRow=({it})=>{
    const off=offSet.has(it.id);
    return (
      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 6px",borderTop:"1px solid #f0e8d6"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:off?"#a09070":"#3a2a1a",textDecoration:off?"line-through":"none"}}>{it.name}</div>
          <div style={{fontSize:"10px",color:"#8a6a4a"}}>{it._catLabel||""} {it.normal?`$${it.normal}`:""}</div>
        </div>
        <button onClick={()=>toggle(it.id)}
          style={{padding:"7px 12px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"800",cursor:"pointer",whiteSpace:"nowrap",
            background:off?"#c04030":"#dfeadf",color:off?"#fff":"#1a6a3a"}}>
          {off?"已關閉(點恢復)":"關閉此品項"}
        </button>
      </div>
    );
  };
  return (
    <div style={{minHeight:"100vh",background:"#f5efe2",display:"flex",flexDirection:"column"}}>
      <div className="np" style={{padding:"8px 12px",background:"#ede2d0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#6a4a2e",fontSize:"14px",cursor:"pointer",fontWeight:"700"}}>← 返回</button>
        <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e"}}>🚫 品項上下架（按日期）</div>
        <div style={{width:"50px"}}/>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"12px"}}>
        <div style={{background:"#fdfaf4",border:"1px solid #e0d5c0",borderRadius:"12px",padding:"12px",marginBottom:"10px"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:"#5a3a28",marginBottom:"5px"}}>選日期（該日訂位的客人點不到關閉的品項）</div>
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
            <input value={date} onChange={e=>setDate(e.target.value)} placeholder="起 7/12"
              style={{width:"92px",padding:"9px 8px",borderRadius:"9px",border:"1.5px solid #c9a45c",background:"#fff",color:"#2e2010",fontSize:"15px",fontWeight:"800",textAlign:"center"}}/>
            <span style={{color:"#8a6a4a",fontWeight:"800"}}>~</span>
            <input value={dateEnd} onChange={e=>setDateEnd(e.target.value)} placeholder="迄（可空）"
              style={{width:"92px",padding:"9px 8px",borderRadius:"9px",border:"1.5px solid #d8c8b0",background:"#fff",color:"#2e2010",fontSize:"15px",fontWeight:"800",textAlign:"center"}}/>
            {dateEnd.trim()&&<button onClick={()=>setDateEnd("")} style={{...chip(false),padding:"6px 8px"}}>只關單日</button>}
          </div>
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap",marginTop:"6px"}}>
            {[0,1,2].map(d=>{ const t=new Date(); t.setDate(t.getDate()+d); const s=`${t.getMonth()+1}/${t.getDate()}`;
              return <button key={d} style={chip(dkey===s&&!dateEnd.trim())} onClick={()=>{setDate(s);setDateEnd("");}}>{d===0?"今天":d===1?"明天":"後天"} {s}</button>; })}
          </div>
          <div style={{marginTop:"6px",fontSize:"11px",color:dateEnd.trim()?"#b05a10":"#8a6a4a",fontWeight:dateEnd.trim()?"800":"400"}}>
            {dateEnd.trim()
              ? `📆 這段共 ${rangeKeys.length} 天都會套用:${rangeKeys[0]} ~ ${rangeKeys[rangeKeys.length-1]}（關/開會一次套整段）`
              : "只關這一天。要一次關連續幾天,右邊「迄」填結束日期。"}
          </div>
          {dates.length>0&&(
            <div style={{marginTop:"8px",fontSize:"11px",color:"#8a6a4a"}}>
              有設定的日期:{dates.map(k=><button key={k} style={{...chip(dkey===k),padding:"3px 8px",marginRight:"5px",fontSize:"11px"}} onClick={()=>{setDate(k);setDateEnd("");}}>{k}（{data[k].length}）</button>)}
            </div>
          )}
        </div>

        {offList.length>0&&(
          <div style={{background:"#fbe0e0",border:"1px solid #d09090",borderRadius:"12px",padding:"12px",marginBottom:"10px"}}>
            <div style={{fontSize:"12px",fontWeight:"800",color:"#b03030",marginBottom:"6px"}}>🚫 {dkey} 已關閉 {offList.length} 項（客人看不到、點不到）</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {offList.map(id=>{ const it=findItem(id);
                return <span key={id} style={{display:"inline-flex",alignItems:"center",gap:"5px",background:"#fff",border:"1px solid #d09090",borderRadius:"7px",padding:"4px 8px",fontSize:"12px",color:"#7a3030",fontWeight:"700"}}>
                  {it?it.name:id}
                  <button onClick={()=>toggle(id)} style={{border:"none",background:"#c04030",color:"#fff",borderRadius:"5px",fontSize:"10px",padding:"1px 6px",cursor:"pointer",fontWeight:"800"}}>恢復</button>
                </span>; })}
            </div>
          </div>
        )}

        {(()=>{
          const seasonItems=[...FOOD_CATS,...DRINK_CATS].flatMap(c=>(MENU[c]?.items||[]).filter(i=>i.season).map(i=>({...i,_catLabel:MENU[c].label})));
          if(seasonItems.length===0) return null;
          const applyAll=()=>{
            if(!sFrom.trim()||!sTo.trim()){ window.alert("上架和下架日期都要填(例如 7/15 和 8/31)"); return; }
            const nd={...sData};
            seasonItems.forEach(i=>{ nd[i.id]={from:normDate(sFrom),to:normDate(sTo)}; });
            setSData(nd); FS.saveDoc("menuSeason",nd);
          };
          const clearOne=(id)=>{ const nd={...sData}; delete nd[id]; setSData(nd); FS.saveDoc("menuSeason",nd); };
          return (
            <div style={{background:"#fdf6ec",border:"1.5px solid #d8b060",borderRadius:"12px",padding:"12px",marginBottom:"10px"}}>
              <div style={{fontSize:"13px",fontWeight:"800",color:"#a06a10",marginBottom:"4px"}}>🍈 季節限定品項（自動上下架）</div>
              <div style={{fontSize:"11px",color:"#8a6a4a",marginBottom:"8px",lineHeight:"1.6"}}>
                設定上架~下架日期後,<b>用餐日期在檔期內</b>的客人才看得到、點得到;檔期一過自動下架,不用手動關。
              </div>
              <div style={{fontSize:"11px",color:"#a04020",marginBottom:"8px",lineHeight:"1.6",background:"#fce8e0",borderRadius:"7px",padding:"6px 9px",fontWeight:"700"}}>
                🍈 榴槤為國外進口,可能臨時無法供應 —— 缺貨當天請直接在下面「🔍搜尋」找到該品項按「關閉此品項」(選當天日期),客人就點不到了。
              </div>
              <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap",marginBottom:"8px"}}>
                <span style={{fontSize:"12px",fontWeight:"700",color:"#5a3a28"}}>檔期</span>
                <input value={sFrom} onChange={e=>setSFrom(e.target.value)} placeholder="上架 7/15"
                  style={{width:"92px",padding:"8px",borderRadius:"9px",border:"1.5px solid #d8b060",background:"#fff",color:"#2e2010",fontSize:"14px",fontWeight:"800",textAlign:"center"}}/>
                <span style={{color:"#8a6a4a",fontWeight:"800"}}>~</span>
                <input value={sTo} onChange={e=>setSTo(e.target.value)} placeholder="下架 8/31"
                  style={{width:"92px",padding:"8px",borderRadius:"9px",border:"1.5px solid #d8b060",background:"#fff",color:"#2e2010",fontSize:"14px",fontWeight:"800",textAlign:"center"}}/>
                <button onClick={applyAll}
                  style={{padding:"8px 14px",borderRadius:"9px",border:"none",background:"#c08a20",color:"#fff",fontSize:"12px",fontWeight:"800",cursor:"pointer"}}>套用到全部季節品項</button>
              </div>
              {seasonItems.map(i=>{
                const w=sData[i.id];
                return (
                  <div key={i.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 4px",borderTop:"1px solid #f0e2c8"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"12px",fontWeight:"700",color:"#3a2a1a"}}>{i.name}</div>
                      <div style={{fontSize:"10px",color:"#8a6a4a"}}>{i._catLabel}</div>
                    </div>
                    {w?(
                      <span style={{fontSize:"11px",fontWeight:"800",color:"#1a6a3a",background:"#dff0e6",borderRadius:"6px",padding:"3px 8px",whiteSpace:"nowrap"}}>🟢 {w.from}~{w.to}</span>
                    ):(
                      <span style={{fontSize:"11px",fontWeight:"800",color:"#a09070",background:"#f0e8d8",borderRadius:"6px",padding:"3px 8px",whiteSpace:"nowrap"}}>未上架</span>
                    )}
                    {w&&<button onClick={()=>clearOne(i.id)} style={{border:"none",background:"#c04030",color:"#fff",borderRadius:"6px",fontSize:"10px",padding:"3px 8px",cursor:"pointer",fontWeight:"800"}}>下架</button>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div style={{background:"#fdfaf4",border:"1px solid #e0d5c0",borderRadius:"12px",padding:"12px"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 搜尋品項,例如:鮭魚"
            style={{width:"100%",boxSizing:"border-box",padding:"11px 12px",borderRadius:"10px",border:"1.5px solid #c9a45c",background:"#fff",color:"#2e2010",fontSize:"15px",fontWeight:"700",marginBottom:"8px"}}/>
          {q.trim()?(
            results.length>0
              ? <>{results.map(it=><ItemRow key={it.id} it={it}/>)}</>
              : <div style={{fontSize:"12px",color:"#a09070",padding:"10px 0",textAlign:"center"}}>找不到「{q}」,換個關鍵字試試</div>
          ):(
            <>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"4px"}}>
                {[...FOOD_CATS,...DRINK_CATS].map(c=>(
                  <button key={c} style={chip(cat===c)} onClick={()=>setCat(c)}>{MENU[c]?.label||c}</button>
                ))}
              </div>
              {(MENU[cat]?.items||[]).map(it=><ItemRow key={it.id} it={{...it,_catLabel:MENU[cat]?.label}}/>)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffPage({ onBack, groups, setGroups, onOpenSummary }) {
  const [filter,setFilter]=useState("");
  const [showMaiOnly,setShowMaiOnly]=useState(false);
  const [showPast,setShowPast]=useState(false);
  const [lastResvImport,setLastResvImport]=useState("");
  const [todoChecks,setTodoChecks]=useState({}); // 手動代辦打勾(關訂位、打電話)，跨裝置同步
  const [newTodo,setNewTodo]=useState("");
  const toggleTodo=(key)=>{ const nn={...todoChecks,[key]:!todoChecks[key]}; setTodoChecks(nn); FS.saveDoc("todo",nn); };
  const todayStr=(()=>{const d=new Date();return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;})();
  useEffect(()=>{
    const unsub=FS.subscribeDoc("dingwe",d=>{ if(d&&d.lastImport!==undefined) setLastResvImport(d.lastImport); });
    const unsub2=FS.subscribeDoc("todo",d=>{ if(d) setTodoChecks(d); });
    // 設定逾期基準日:第一次使用當天,之後才會提醒「昨天沒做完」
    FS.loadDoc("todo").then(d=>{ if(!d || d._since===undefined) FS.saveDoc("todo",{...(d||{}),_since:todayStr}); });
    return ()=>{ unsub&&unsub(); unsub2&&unsub2(); };
  },[]);
  const [showAdd,setShowAdd]=useState(false);
  const [newG,setNewG]=useState({...BLANK_G});
  const [expanded,setExpanded]=useState(null);
  const [toast,setToast]=useState(null);
  const [saving,setSaving]=useState(false);
  const [showDingwe,setShowDingwe]=useState(false);
  const [showStats,setShowStats]=useState(false);
  const [showItemsOff,setShowItemsOff]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [compactMode,setCompactMode]=useState(typeof window!=="undefined"&&window.innerWidth<820);
  const [wOpen,setWOpen]=useState(false);   // 散客客訴視窗
  const [wForm,setWForm]=useState({name:"",phone:"",reason:"",attitude:"",adjust:"",treat:""});
  const [walkinCpl,setWalkinCpl]=useState([]); // 散客客訴清單(綁電話)
  useEffect(()=>{
    FS.loadDoc("walkinCpl").then(v=>{ if(Array.isArray(v)) setWalkinCpl(v); });
    const u=FS.subscribeDoc("walkinCpl", v=>{ if(Array.isArray(v)) setWalkinCpl(v); });
    return ()=>u&&u();
  },[]);
  const [staffList,setStaffList]=useState(DEFAULT_STAFF);
  const [showStaff,setShowStaff]=useState(false);
  const [newStaff,setNewStaff]=useState("");

  useEffect(()=>{
    FS.loadDoc("staff").then(v=>{ if(Array.isArray(v)&&v.length>0) setStaffList(v); });
    const unsub = FS.subscribeDoc("staff", v=>{ if(Array.isArray(v)&&v.length>0) setStaffList(v); });
    return ()=>unsub&&unsub();
  },[]);
  const saveStaff=(list)=>{ setStaffList(list); FS.saveDoc("staff", list); };
  const [customHolidays,setCustomHolidays]=useState([]);
  const [showHoliday,setShowHoliday]=useState(false);
  const [newHoliday,setNewHoliday]=useState("");
  useEffect(()=>{
    FS.loadDoc("holidays").then(v=>{ if(Array.isArray(v)){ setCustomHolidays(v); if(typeof window!=="undefined") window.__customHolidays=v; } });
    const unsub=FS.subscribeDoc("holidays",v=>{ if(Array.isArray(v)){ setCustomHolidays(v); if(typeof window!=="undefined") window.__customHolidays=v; } });
    return ()=>unsub&&unsub();
  },[]);
  const saveHolidays=(list)=>{ setCustomHolidays(list); if(typeof window!=="undefined") window.__customHolidays=list; FS.saveDoc("holidays",list); };

  const showToast=(msg,dur=2000)=>{setToast(msg);setTimeout(()=>setToast(null),dur);};

  const toggle=(id,f)=>setGroups(p=>p.map(g=>{
    if(g.id!==id) return g;
    const nv=!g[f];
    if(f==="cancelled"){ // 取消 → 直接封存收起來;取消勾掉 → 還原
      return nv ? {...g,cancelled:true,archived:true,archiveType:"cancelled"}
                : {...g,cancelled:false,archived:false,archiveType:g.archiveType==="cancelled"?"":g.archiveType};
    }
    return {...g,[f]:nv};
  }));
  const save=(id,f,v)=>setGroups(p=>p.map(g=>g.id===id?{...g,[f]:v}:g));
  const del=(id)=>{if(window.confirm("確定刪除？"))setGroups(p=>p.filter(g=>g.id!==id));};
  const copyCode=(code)=>{navigator.clipboard?.writeText(code).catch(()=>{});showToast(`代碼 ${code} 已複製`);};

  // 電話 → 客訴總數(跨所有訂位,含已封存 + 散客客訴),姓名欄顯示 ⚠客訴 用
  const phoneCplMap={};
  groups.forEach(gg=>{ const p2=normPhone(gg.phone); if(p2&&(gg.complaints||[]).length>0) phoneCplMap[p2]=(phoneCplMap[p2]||0)+(gg.complaints||[]).length; });
  walkinCpl.forEach(c=>{ const p2=normPhone(c.phone); if(p2) phoneCplMap[p2]=(phoneCplMap[p2]||0)+1; });

  const filtered=showMaiOnly
    ? groups.filter(g=>g.fromMai&&!(g.archived&&g.archiveType!=="menu"))
    : filter.trim()
    ? groups.filter(g=>(g.date||"").includes(filter.trim())||(g.phone||"").includes(filter.trim())||(g.name||"").includes(filter.trim()))
    : groups.filter(g=>!g.fromMai&&!(g.archived&&g.archiveType!=="menu")&&(showPast?isPastMeal(g):!isPastMeal(g)));
  const parseDT=(g)=>{const[m,d]=(g.date||"0/0").split("/").map(Number);const[h,mi]=(g.time||"0:0").split(":").map(Number);return (m||0)*1000000+(d||0)*10000+(h||0)*100+(mi||0);};
  filtered.sort((a,b)=>parseDT(a)-parseDT(b));
  const overdueGs=groups.filter(g=>depositUrgency(g)==="overdue");
  const urgentGs =groups.filter(g=>depositUrgency(g)==="urgent");

const rowBg=(g)=>{
    if(g.cancelled)return"#f0dcdc";
    if(g.archived)return"#dce8dc";
    if(isPastMeal(g))return"#ece8e0";
    const u=depositUrgency(g);
    if(u==="overdue")return"#f5d5d5";
    if(u==="urgent")return"#f5e5d0";
    return"#fdfaf4";
  };

  const Chk=({g,field,color})=>(
    <div onClick={()=>toggle(g.id,field)} style={{cursor:"pointer",textAlign:"center",fontSize:"14px",
      color:g[field]?color:"#2e2010",userSelect:"none",padding:"2px 0"}}>
      {g[field]?"✓":"○"}
    </div>
  );

  const MemberBadge=({g})=>{
    const opts=[
      {val:"none",  label:"非會員",color:"#7a5c3e"},
      {val:"existing",label:"✦ 會員",color:"#c4924a"},
      {val:"new",   label:"★ 入會",color:"#2a7a4a"},
      {val:"private",label:"🎉 包場",color:"#a85ab4"},
    ];
    return(
      <div style={{display:"flex",flexDirection:"column",gap:"2px",alignItems:"center"}}>
        {opts.map(o=>(
          <div key={o.val} onClick={()=>save(g.id,"memberType",o.val)}
            style={{cursor:"pointer",padding:"1px 7px",borderRadius:"5px",fontSize:"10px",fontWeight:"700",
              background:g.memberType===o.val?"#ddd0bc":"transparent",
              color:g.memberType===o.val?o.color:"#a09070",
              border:`1px solid ${g.memberType===o.val?o.color:"transparent"}`}}>
            {o.label}
          </div>
        ))}
        <div onClick={()=>setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,custom:!x.custom}))}
          style={{cursor:"pointer",padding:"1px 7px",borderRadius:"5px",fontSize:"10px",fontWeight:"700",marginTop:"3px",
            background:g.custom?"#e8dcc0":"transparent",color:g.custom?"#9c5a1c":"#9a8a76",
            border:`1px solid ${g.custom?"#c89a5a":"#e0d5c0"}`}}>
          {g.custom?"✓ 客製化":"客製化"}
        </div>
      </div>
    );
  };

  if(showDingwe) return <DingwePage groups={groups} onBack={()=>setShowDingwe(false)} staffList={staffList} setGroups={setGroups}/>;
  if(showStats) return <StatsPage onBack={()=>setShowStats(false)} staffList={staffList}/>;
  if(showItemsOff) return <ItemsOffPage onBack={()=>setShowItemsOff(false)}/>;

  const COLS=[
    {key:"date",       label:"日期",    w:50, text:true},
    {key:"time",       label:"時間",    w:50, text:true},
    {key:"name",       label:"姓名",    w:54, text:true},
    {key:"phone",      label:"電話",    w:102,text:true},
    {key:"headcount",  label:"人數",    w:60, text:true},
    {key:"bookDate",   label:"訂位日",  w:50, text:true},
    {key:"deposit",    label:"訂金",    w:74, text:true},
    {key:"depositDate",label:"付訂日",  w:66, text:true},
    {key:"collector",  label:"收款人",  w:48, text:true},
    {key:"refundSigned",label:"退款\n簽名",w:44,chk:true,color:"#e87a5a"},
    {key:"cancelled",  label:"取消",   w:38, chk:true,color:"#c05050"},
    {key:"note",       label:"備註",   w:220,text:true},
  ];
  const compactKeys=["date","time","name","headcount"];
  const shownCols = compactMode ? COLS.filter(c=>compactKeys.includes(c.key)) : COLS;
  const statusAnchor = compactMode ? "headcount" : "collector";

  return(
    <div style={{...S.page,background:"#f5f0e8",color:"#3a2a1a"}}>
      <style>{GS}</style>
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#e2f2e8",border:"1px solid #2a7a4a",borderRadius:"10px",padding:"8px 18px",fontSize:"12px",color:"#2a7a4a",fontWeight:"700",zIndex:999,whiteSpace:"nowrap"}}>{toast}</div>}

      <div style={{...S.header,paddingBottom:"10px"}}>
        <button onClick={onBack} style={S.backBtn}>← 離開</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={S.logo}>✦ 大訂追蹤表 v89</div>
          <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
            <div style={{fontSize:"9px",color:"#2a7a4a",background:"#e2f2e8",borderRadius:"6px",padding:"3px 7px"}}>🔥 即時同步</div>
            <button onClick={()=>setShowStaff(true)} style={{background:"#e8d8f0",border:"none",borderRadius:"8px",color:"#6a3a8a",fontSize:"12px",fontWeight:"700",padding:"7px 10px",cursor:"pointer"}}>員工</button>
            <button onClick={()=>setShowHoliday(true)} style={{background:"#f0e0d0",border:"none",borderRadius:"8px",color:"#a05a20",fontSize:"12px",fontWeight:"700",padding:"7px 10px",cursor:"pointer"}}>假日</button>
            <button onClick={()=>setShowItemsOff(true)} style={{background:"#f5e2c0",border:"none",borderRadius:"8px",color:"#8a5210",fontSize:"12px",fontWeight:"700",padding:"7px 10px",cursor:"pointer"}}>🚫品項</button>
            <button onClick={()=>setShowAdd(true)} style={{background:"#b07840",border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:"700",padding:"7px 14px",cursor:"pointer"}}>+ 新增大訂</button>
            <button onClick={()=>{setWForm({name:"",phone:"",reason:"",attitude:"",adjust:"",treat:""});setWOpen(true);}} style={{background:"#fbe0e0",border:"none",borderRadius:"8px",color:"#a04020",fontSize:"12px",fontWeight:"700",padding:"7px 10px",cursor:"pointer"}}>散客客訴</button>
            <button onClick={()=>setCompactMode(v=>!v)} style={{background:compactMode?"#3a7a5a":"#e0d2bc",border:"none",borderRadius:"8px",color:compactMode?"#fff":"#6a4a2e",fontSize:"12px",fontWeight:"800",padding:"7px 10px",cursor:"pointer"}}>{compactMode?"📱 手機版":"💻 電腦版"}</button>
            <button onClick={()=>setShowHelp(v=>!v)} style={{background:showHelp?"#6a4a2e":"#efe6d4",border:"1px solid #c8b89c",borderRadius:"8px",color:showHelp?"#fff":"#6a4a2e",fontSize:"12px",fontWeight:"800",padding:"7px 10px",cursor:"pointer"}}>❔ 說明</button>
          </div>
        </div>
        {showHelp&&(
          <div style={{background:"#fffaf0",border:"1.5px solid #d8c090",borderRadius:"12px",padding:"12px 14px",marginBottom:"10px"}}>
            <div style={{fontSize:"13px",fontWeight:"800",color:"#8a5210",marginBottom:"8px",borderBottom:"2px solid #d8c090",paddingBottom:"6px"}}>📖 各按鍵用途</div>
            {[
              ["📥 麥訂","從大麥匯入、還沒轉成正式訂位的。點一下只看這些,處理完按「轉一般」。有紅色 ! 表示有待處理。"],
              ["過期訂單","用餐日已過、還沒收掉的訂位。點開處理:直接封存,或有狀況就填「客訴與建議」。有紅色 ! 表示有待處理。"],
              ["人數統計表","訂位人數統計表。每週一三五要導入訂位、關滿20的紅色時段。裡面有步驟 1-2-3 指引。有紅色 ! 表示今天還沒做完。"],
              ["員工","管理夥伴名單(新增/刪除),就是各種「選夥伴」會出現的名字。"],
              ["假日","設定哪些日期算假日(影響備料、訂位人數標準)。"],
              ["🚫 品項","按日期關閉餐點(可選幾號到幾號);季節限定品項在這裡設上架~下架檔期,自動上下架。"],
              ["散客客訴","沒有訂位的現場客人要記客訴,按這裡。記錄綁電話,之後同一支電話訂位會自動提醒。"],
              ["+ 新增大訂","手動新增一筆大訂訂位(客人沒線上訂、或電話訂位時用)。"],
            ].map(([k,v],i2,arr)=>(
              <div key={k} style={{display:"flex",gap:"8px",padding:"7px 0",fontSize:"12px",lineHeight:"1.6",borderBottom:i2<arr.length-1?"1px solid #eee0c4":"none"}}>
                <span style={{fontWeight:"800",color:"#6a4a2e",flexShrink:0,minWidth:"78px"}}>{k}</span>
                <span style={{color:"#5a4530"}}>{v}</span>
              </div>
            ))}
            <div style={{fontSize:"11px",color:"#8a6a4a",marginTop:"8px",borderTop:"2px solid #d8c090",paddingTop:"7px"}}>下方每組點餐狀態格可點:選「已封存/現場點餐」等。過期的訂位會出現「直接封存 / 客訴與建議」。</div>
          </div>
        )}
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setShowDingwe(true)} style={{padding:"11px 14px",borderRadius:"9px",border:"none",background:"#dce8f4",color:"#1a4a6a",fontSize:"15px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>人數統計表{(()=>{const d=new Date().getDay();if(![1,3,5].includes(d))return null;return todoChecks[`close_${todayStr}`]?null:<span className="blinkExcl">!</span>;})()}</button>
          <button onClick={()=>setShowMaiOnly(v=>!v)} style={{padding:"11px 16px",borderRadius:"9px",border:"none",background:showMaiOnly?"#3a7a5a":"#e0d2bc",color:showMaiOnly?"#fff":"#6a4a2e",fontSize:"15px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",position:"relative"}}>📥麥訂{showMaiOnly?" ✓":""}{(()=>{const n=groups.filter(g=>g.fromMai&&!g.cancelled).length;return n>0?<> ({n})<span className="blinkExcl">!</span></>:"";})()}</button>
          <button onClick={()=>setShowPast(v=>!v)} style={{padding:"11px 16px",borderRadius:"9px",border:"none",background:showPast?"#8a6a4a":"#e0d2bc",color:showPast?"#fff":"#6a4a2e",fontSize:"15px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>{showPast?"隱藏過期":"過期訂單"}{(()=>{const n=groups.filter(g=>!g.fromMai&&!g.cancelled&&!(g.archived&&g.archiveType!=="menu")&&isPastMeal(g)).length;return n>0?<> ({n})<span className="blinkExcl">!</span></>:"";})()}</button>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="篩選日期（如 5/3）"
            style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",flex:1,padding:"8px 12px",fontSize:"12px"}}/>
          {filter&&<button onClick={()=>setFilter("")} style={{background:"none",border:"none",color:"#b07840",fontSize:"16px",cursor:"pointer"}}>✕</button>}
        </div>
        {(()=>{
          const maiN=groups.filter(g=>g.fromMai&&!g.cancelled).length;
          const pastN=groups.filter(g=>!g.fromMai&&!g.cancelled&&!(g.archived&&g.archiveType!=="menu")&&isPastMeal(g)).length;
          const importedToday = lastResvImport===todayStr;
          const dow=new Date().getDay(); // 0日 1一 2二 3三 4四 5五 6六
          const needClose=[1,3,5].includes(dow);  // 一三五 要關訂位
          const needCall=[3,4].includes(dow);      // 三四 要打電話確認週末
          const needSave=[1,3,5].includes(dow);    // 一三五 要存錢
          const needKey=[1,2,3,4,5].includes(dow); // 平日 key人事/物料
          const closeDone=todoChecks[`close_${todayStr}`];
          const callDone=todoChecks[`call_${todayStr}`];
          const saveDone=todoChecks[`save_${todayStr}`];
          const keyDone=todoChecks[`key_${todayStr}`];
          const customToday=(todoChecks.customList||[]).filter(t=>t.date===todayStr);
          const customAllDone=customToday.every(t=>todoChecks[`custom_${t.id}`]);
          // 前幾天沒做完的(補做提醒)—— 只從開始使用的基準日之後算
          const overdueTasks=[];
          const sinceParts=(todoChecks._since||todayStr).split("/").map(Number);
          const sinceDate=new Date(sinceParts[0],sinceParts[1]-1,sinceParts[2]);
          for(let i=1;i<=4;i++){
            const dd=new Date(); dd.setHours(0,0,0,0); dd.setDate(dd.getDate()-i);
            if(dd<sinceDate) continue;
            const ds=`${dd.getFullYear()}/${dd.getMonth()+1}/${dd.getDate()}`;
            const wd=dd.getDay(); const wl=["日","一","二","三","四","五","六"][wd];
            if([1,3,5].includes(wd)&&!todoChecks[`close_${ds}`]) overdueTasks.push({key:`close_${ds}`,text:`🔒 ${ds}（${wl}）的關訂位還沒做`});
            if([3,4].includes(wd)&&!todoChecks[`call_${ds}`]) overdueTasks.push({key:`call_${ds}`,text:`📞 ${ds}（${wl}）的打電話確認還沒做`});
            if([1,3,5].includes(wd)&&!todoChecks[`save_${ds}`]) overdueTasks.push({key:`save_${ds}`,text:`💰 ${ds}（${wl}）的存錢還沒做`});
          }
          const allDone = importedToday && maiN===0 && pastN===0 && overdueGs.length===0 && urgentGs.length===0 && overdueTasks.length===0 && (!needClose||closeDone) && (!needCall||callDone) && (!needSave||saveDone) && (!needKey||keyDone) && customAllDone;
          return (
            <div style={{marginTop:"8px",background:"#efe6d4",borderRadius:"12px",border:"1px solid #d8c8b0",padding:"10px 12px"}}>
              <div style={{fontSize:"12px",color:"#c8a060",fontWeight:"800",marginBottom:allDone?"0":"8px",display:"flex",alignItems:"center",gap:"6px"}}>📋 櫃檯代辦{allDone&&<span style={{fontSize:"10px",color:"#2a7a4a",fontWeight:"700"}}>✓ 今日都完成</span>}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {overdueTasks.map(t=>(
                  <div key={t.key} onClick={()=>toggleTodo(t.key)} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",background:"#fbe0e0",border:"1px solid #d09090",borderRadius:"8px",padding:"6px 8px"}}>
                    <span style={{fontSize:"13px"}}>⏰</span>
                    <span style={{fontSize:"13px",color:"#b03030",fontWeight:"800"}}>補做：{t.text}</span>
                    <span style={{fontSize:"10px",color:"#c08070",marginLeft:"auto"}}>點一下打勾</span>
                  </div>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:"8px",opacity:importedToday?0.55:1}}>
                  <span style={{fontSize:"13px"}}>{importedToday?"✅":"🔴"}</span>
                  <span style={{fontSize:"13px",color:importedToday?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:importedToday?"line-through":"none"}}>🔄 每天導入 1 個月內訂位</span>
                  {importedToday&&<span style={{fontSize:"10px",color:"#6a8a6a"}}>今天已導入</span>}
                </div>
                {needClose&&(
                  <div onClick={()=>toggleTodo(`close_${todayStr}`)} style={{display:"flex",alignItems:"center",gap:"8px",opacity:closeDone?0.55:1,cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>{closeDone?"✅":"🔴"}</span>
                    <span style={{fontSize:"13px",color:closeDone?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:closeDone?"line-through":"none"}}>🔒 今天（{["日","一","二","三","四","五","六"][dow]}）要關訂位</span>
                    {closeDone&&<span style={{fontSize:"10px",color:"#6a8a6a"}}>已完成</span>}
                  </div>
                )}
                {needCall&&(
                  <div onClick={()=>toggleTodo(`call_${todayStr}`)} style={{display:"flex",alignItems:"flex-start",gap:"8px",opacity:callDone?0.55:1,cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>{callDone?"✅":"🔴"}</span>
                    <span style={{fontSize:"13px",color:callDone?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:callDone?"line-through":"none"}}>📞 打電話確認 週五六日 5位以上訂位是否有更動</span>
                    {callDone&&<span style={{fontSize:"10px",color:"#6a8a6a"}}>已完成</span>}
                  </div>
                )}
                {needSave&&(
                  <div onClick={()=>toggleTodo(`save_${todayStr}`)} style={{display:"flex",alignItems:"center",gap:"8px",opacity:saveDone?0.55:1,cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>{saveDone?"✅":"🔴"}</span>
                    <span style={{fontSize:"13px",color:saveDone?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:saveDone?"line-through":"none"}}>💰 今天（{["日","一","二","三","四","五","六"][dow]}）要存錢</span>
                    {saveDone&&<span style={{fontSize:"10px",color:"#6a8a6a"}}>已完成</span>}
                  </div>
                )}
                {needKey&&(
                  <div onClick={()=>toggleTodo(`key_${todayStr}`)} style={{display:"flex",alignItems:"center",gap:"8px",opacity:keyDone?0.55:1,cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>{keyDone?"✅":"🔴"}</span>
                    <span style={{fontSize:"13px",color:keyDone?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:keyDone?"line-through":"none"}}>⌨️ 平日空閒時 key 人事和物料</span>
                    {keyDone&&<span style={{fontSize:"10px",color:"#6a8a6a"}}>已完成</span>}
                  </div>
                )}
                {customToday.map(t=>{
                  const done=todoChecks[`custom_${t.id}`];
                  return (
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:"8px",opacity:done?0.55:1}}>
                      <span onClick={()=>toggleTodo(`custom_${t.id}`)} style={{fontSize:"13px",cursor:"pointer"}}>{done?"✅":"🔴"}</span>
                      <span onClick={()=>toggleTodo(`custom_${t.id}`)} style={{fontSize:"13px",color:done?"#7a9a7a":"#3a2a1a",fontWeight:"700",textDecoration:done?"line-through":"none",cursor:"pointer",flex:1}}>📝 {t.text}</span>
                      <span onClick={()=>{const nn={...todoChecks,customList:(todoChecks.customList||[]).filter(x=>x.id!==t.id)};delete nn[`custom_${t.id}`];setTodoChecks(nn);FS.saveDoc("todo",nn);}} style={{fontSize:"11px",color:"#a06050",cursor:"pointer",padding:"0 4px"}}>✕</span>
                    </div>
                  );
                })}
                <div style={{display:"flex",gap:"6px",marginTop:"2px"}}>
                  <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} placeholder="＋ 新增今日待辦…"
                    style={{flex:1,padding:"6px 10px",borderRadius:"8px",border:"1px solid #4a3520",background:"#ffffff",color:"#3a2a1a",fontSize:"12px"}}/>
                  <button onClick={()=>{const t=newTodo.trim();if(!t)return;const item={id:`${Date.now()}`,text:t,date:todayStr};const nn={...todoChecks,customList:[...(todoChecks.customList||[]),item]};setTodoChecks(nn);FS.saveDoc("todo",nn);setNewTodo("");}}
                    style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#b07840",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>新增</button>
                </div>
                {maiN>0&&(
                  <div onClick={()=>{setShowMaiOnly(true);setShowPast(false);}} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>🔴</span>
                    <span style={{fontSize:"13px",color:"#1a6a3a",fontWeight:"700"}}>📥 {maiN} 筆麥訂待轉一般 →</span>
                  </div>
                )}
                {pastN>0&&(
                  <div onClick={()=>{setShowPast(true);setShowMaiOnly(false);}} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
                    <span style={{fontSize:"13px"}}>🔴</span>
                    <span style={{fontSize:"13px",color:"#8a5210",fontWeight:"700"}}>⏰ {pastN} 筆過期待處理 →</span>
                  </div>
                )}
                {overdueGs.length>0&&(
                  <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
                    <span style={{fontSize:"13px"}}>🔴</span>
                    <span style={{fontSize:"13px",color:"#e87a5a",fontWeight:"700"}}>💰 逾期未付訂：{overdueGs.map(g=>`${g.name} ${g.date}`).join("、")}</span>
                  </div>
                )}
                {urgentGs.length>0&&(
                  <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
                    <span style={{fontSize:"13px"}}>⚠️</span>
                    <span style={{fontSize:"12px",color:"#caa060"}}>即將到期：{urgentGs.map(g=>`${g.name} 還剩${3-daysSinceBook(g.bookDate)}天`).join("、")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        <div style={{fontSize:"10px",color:"#5a3a28",marginTop:"6px"}}>{filtered.length} 組 · {compactMode?"手機版:點一列展開看全部欄位":"左右滑動查看所有欄位"}</div>
      </div>

      <div style={{overflowX:"auto",overflowY:"auto",flex:1}}>
        <table style={{borderCollapse:"collapse",fontSize:"11px",whiteSpace:"nowrap"}}>
          <thead>
            <tr style={{background:"#efe6d4",position:"sticky",top:0,zIndex:5}}>
              <th style={{...TH,minWidth:80}}>代碼</th>
              <th style={{...TH,minWidth:66}}>會員</th>
              <th style={{...TH,minWidth:50}}>點餐<br/>數量</th>
              {shownCols.map(c=>(<React.Fragment key={c.key}><th style={{...TH,minWidth:c.w,whiteSpace:"pre-line"}}>{c.label}</th>{c.key===statusAnchor&&<th style={{...TH,minWidth:74}}>點餐<br/>狀態</th>}</React.Fragment>))}
              <th style={{...TH,minWidth:34}}>刪</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={shownCols.length+4} style={{textAlign:"center",padding:"40px",color:"#a09070"}}>尚無紀錄</td></tr>}
            {filtered.map(g=>(
              <>
                <tr key={g.id} style={{background:rowBg(g),opacity:g.cancelled?0.55:(isPastMeal(g)&&!g.archived?0.6:1),borderBottom:"1px solid #f0e8d6"}}>
                  <td style={{padding:"5px 6px",borderRight:"1px solid #e0d5c0",textAlign:"center"}}>
                    {g.memberType==="private"
                      ? <div style={{fontSize:"14px",fontWeight:"700",color:"#a85ab4"}}>🎉 包場</div>
                      : !g.memberType
                        ? <div onClick={()=>showToast("請先在右邊「會員」欄確認身分，才會顯示代碼")} style={{cursor:"pointer",fontSize:"10px",fontWeight:"700",color:"#c06030",background:"#fbeede",border:"1px solid #e8c8a0",borderRadius:"6px",padding:"4px 5px",lineHeight:"1.3"}}>⚠ 先確認<br/>會員身分</div>
                        : <div style={{fontSize:"14px",fontWeight:"700",color:"#8a5210"}}>{g.code}</div>}
                    {g.memberType&&g.memberType!=="private" && <button onClick={()=>copyCode(g.code)} style={{fontSize:"9px",padding:"1px 6px",borderRadius:"4px",background:"#ddd0bc",border:"1px solid #d0c0a8",color:"#6a4a2e",cursor:"pointer",marginTop:"2px"}}>複製</button>}
                    {g.custom&&<div style={{fontSize:"9px",background:"#e8dcc0",color:"#9c5a1c",borderRadius:"4px",padding:"1px 4px",marginTop:"2px",fontWeight:"700"}}>客製化</div>}
                    {!g.unlockOverride&&(g.locked||isPastDeadline(g.date))&&<div style={{fontSize:"9px",background:"#fbdcdc",color:"#b03030",borderRadius:"4px",padding:"1px 4px",marginTop:"2px",fontWeight:"700"}}>🔒已鎖</div>}
                    {depositUrgency(g)==="overdue"&&<div style={{fontSize:"9px",background:"#fbdcdc",color:"#b03030",borderRadius:"4px",padding:"1px 4px",marginTop:"2px",fontWeight:"700"}}>逾期</div>}
                    {depositUrgency(g)==="urgent" &&<div style={{fontSize:"9px",background:"#5a3a10",color:"#ffd080",borderRadius:"4px",padding:"1px 4px",marginTop:"2px",fontWeight:"700"}}>待付訂</div>}
                    {depositUrgency(g)&&(()=>{const dd=depDeadlineOf(g);return dd?<div style={{fontSize:"8px",color:"#b06020",marginTop:"1px",fontWeight:"800",whiteSpace:"nowrap"}}>{dd.lastMinute?"⏰訂後2hr內":`⏰${dd.label}前`}</div>:null;})()}
                  </td>
                  <td style={{padding:"5px 4px",borderRight:"1px solid #e0d5c0"}}><MemberBadge g={g}/></td>
                  <td style={{padding:"5px 6px",borderRight:"1px solid #e0d5c0",textAlign:"center"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                      <button onClick={()=>setExpanded(expanded===g.id?null:g.id)}
                        style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}>
                        <span style={{fontSize:"15px",fontWeight:"700",color:g.orders.length>0?"#2a7a4a":"#5a3a28"}}>{g.orders.length}</span>
                        <span style={{fontSize:"9px",color:"#5a3a28"}}>已點</span>
                        <span style={{fontSize:"9px",color:expanded===g.id?"#8a5210":"#5a3a28"}}>{expanded===g.id?"▲":"▼"}</span>
                      </button>
                      {(g.orders||[]).some(o=>(o.lines||[]).some(l=>l.setMeal&&l.setMeal.veggieSoup))&&(
                        <span style={{fontSize:"9px",fontWeight:"800",color:"#dfeadf",background:"#5fe08a",borderRadius:"4px",padding:"1px 5px"}}>🌿 素湯</span>
                      )}
                      <button onClick={()=>setGroups(p=>p.map(x=>{
                          if(x.id!==g.id) return x;
                          const eff = !x.unlockOverride && (x.locked || isPastDeadline(x.date));
                          return eff ? {...x, locked:false, unlockOverride:true}   // 目前鎖著 → 解鎖
                                     : {...x, locked:true,  unlockOverride:false}; // 目前開著 → 上鎖
                        }))}
                        style={{fontSize:"9px",padding:"2px 5px",borderRadius:"5px",border:"none",cursor:"pointer",
                          background:(!g.unlockOverride&&(g.locked||isPastDeadline(g.date)))?"#fbdcdc":"#dfeadf",color:(!g.unlockOverride&&(g.locked||isPastDeadline(g.date)))?"#b03030":"#2a7a4a",fontWeight:"700"}}>
                        {(!g.unlockOverride&&(g.locked||isPastDeadline(g.date)))?"🔒":"🔓"}
                      </button>
                    </div>
                  </td>
                  {shownCols.map(c=>{
                    const noDep = (["deposit","depositDate","collector"].includes(c.key))&&!needsDeposit(g.headcount,g.isVip);
                    return (
                    <React.Fragment key={c.key}>
                    <td style={{padding:"5px 4px",borderRight:"1px solid #e0d5c0",verticalAlign:"middle",
                      textAlign:c.chk||c.key==="collector"?"center":"left",
                      background:noDep?"#e6dece":undefined,opacity:noDep?0.45:1}}>
                      {noDep?<div style={{color:"#a09070",fontSize:"11px",textAlign:"center"}}>—</div>:
                       c.chk?<Chk g={g} field={c.key} color={c.color}/>:
                       c.key==="collector"?<CollectorCell g={g} onSave={save}/>:
                       c.key==="headcount"?<HeadcountCell g={g} onSave={save} setGroups={setGroups}/>:
                       c.key==="name"?(
                         <div>
                           <EditCell g={g} field={c.key} w={c.w-8} onSave={save}/>
                           {(()=>{const n=phoneCplMap[normPhone(g.phone)];return n?(
                             <div style={{marginTop:"2px",fontSize:"9px",fontWeight:"800",color:"#fff",background:"#c04030",borderRadius:"5px",padding:"1px 5px",display:"inline-block"}}>⚠客訴×{n} 點開看</div>
                           ):null;})()}
                         </div>
                       ):
                       c.key==="deposit"?(
                         <div>
                           <div style={{display:"flex",alignItems:"center",gap:"4px",justifyContent:"center"}}>
                             <div style={{flex:1}}><EditCell g={g} field={c.key} w={c.w-30} onSave={save}/></div>
                             <div onClick={()=>setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,payCash:!x.payCash}))} title="付款方式"
                               style={{cursor:"pointer",fontSize:"9px",fontWeight:"700",borderRadius:"5px",padding:"1px 4px",whiteSpace:"nowrap",
                                 background:g.payCash?"#d4a017":"#e0e8f0",color:g.payCash?"#fff":"#6a8aaa"}}>
                               {g.payCash?"現金":"轉"}
                             </div>
                           </div>
                           {g.depositLast5&&(
                             <div onClick={()=>setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,depositStatus:x.depositStatus==="已核對"?"待核對":"已核對"}))}
                               title="點一下切換 待核對 / 已核對（客人端會同步看到）"
                               style={{marginTop:"3px",fontSize:"9px",fontWeight:"700",borderRadius:"5px",padding:"2px 4px",cursor:"pointer",textAlign:"center",whiteSpace:"nowrap",
                                 background:g.depositStatus==="已核對"?"#dfeadf":"#f5e8d0",color:g.depositStatus==="已核對"?"#2a7a4a":"#8a5210"}}>
                               末5:{g.depositLast5} {g.depositStatus==="已核對"?"✓已核對":"待核對"}
                             </div>
                           )}
                         </div>
                       ):
                       <EditCell g={g} field={c.key} w={c.w-8} onSave={save}/>}
                    </td>
                    {c.key===statusAnchor&&<td style={{padding:"4px 3px",borderRight:"1px solid #e0d5c0",textAlign:"center",minWidth:"74px"}}>
                      <StatusCell g={g} onSave={save} groups={groups} setGroups={setGroups} staffList={staffList}/>
                    </td>}
                    </React.Fragment>
                    );
                  })}
                  <td style={{padding:"5px",textAlign:"center"}}>
                    <button onClick={()=>del(g.id)} style={{background:"none",border:"1px solid #e0b0b0",borderRadius:"4px",color:"#7a3030",fontSize:"10px",cursor:"pointer",padding:"1px 5px"}}>✕</button>
                  </td>
                </tr>
                {expanded===g.id&&(
                  <tr key={g.id+"-exp"}>
                    <td colSpan={shownCols.length+4} style={{background:"#faf6ee",padding:"8px 10px",borderBottom:"2px solid #c8b89c"}}>
                      {compactMode&&(
                        <div style={{background:"#fff",border:"1px solid #e0d5c0",borderRadius:"10px",padding:"10px 12px",marginBottom:"8px"}}>
                          <div style={{fontSize:"11px",fontWeight:"800",color:"#8a5210",marginBottom:"6px"}}>📋 完整欄位</div>
                          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"5px 10px",fontSize:"13px",alignItems:"center"}}>
                            {COLS.filter(c=>!compactKeys.includes(c.key)&&c.text).map(c=>(
                              <React.Fragment key={c.key}>
                                <span style={{color:"#8a6a4a",fontSize:"12px",whiteSpace:"nowrap"}}>{(c.label||"").replace("\n","")}</span>
                                <div>{c.key==="collector"?<CollectorCell g={g} onSave={save}/>:<EditCell g={g} field={c.key} w={"100%"} onSave={save}/>}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      <ComplaintPanel g={g} setGroups={setGroups} groups={groups} walkin={walkinCpl}/>
                      {(g.refundStaffSig||g.refundCustomerSig)&&(
                        <div style={{padding:"10px 12px",background:"#f0f6f0",borderRadius:"10px",margin:"8px 0",border:"1px solid #b8d0b8"}}>
                          <div style={{fontSize:"12px",color:"#2a6a2a",fontWeight:"700",marginBottom:"8px"}}>💰 退款簽名記錄</div>
                          <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                            {[["staff","員工","refundStaffSig","refundStaffSigTime"],["customer","客人","refundCustomerSig","refundCustomerSigTime"]].map(([t,label,sk,tk])=>(
                              <div key={t} style={{flex:1,minWidth:"140px",padding:"8px",background:"#fff",borderRadius:"8px",border:`1px solid ${g[sk]?"#2a6a3a":"#ddd"}`}}>
                                <div style={{fontSize:"11px",color:g[sk]?"#2a6a2a":"#999",marginBottom:"4px"}}>{g[sk]?"✓ ":""}{label}簽名{g[tk]?`（${g[tk]}）`:""}</div>
                                {g[sk]&&<img src={g[sk]} style={{width:"100%",maxHeight:"80px",objectFit:"contain",background:"#fafafa",borderRadius:"6px"}}/>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{padding:"12px 16px"}}>
                        <div style={{fontSize:"12px",color:"#8a5210",fontWeight:"700",marginBottom:"10px"}}>
                          📋 {g.name} 的點餐 — {g.orders.length} 人
                        </div>
                        <button onClick={()=>onOpenSummary&&onOpenSummary(g)}
                          style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#6a3a8a",color:"#fff",fontSize:"13px",fontWeight:"800",cursor:"pointer",marginBottom:"10px"}}>
                          📋 開啟全組訂單 員工版（新增訂單／改素湯／封存照片,免密碼）
                        </button>
                        {g.orders.length===0?(
                          <div style={{fontSize:"11px",color:"#5a3a28",background:"#fdfaf4",borderRadius:"10px",padding:"12px"}}>
                            傳送代碼 <span style={{color:"#8a5210",fontWeight:"700"}}>{g.code}</span> 給客人即可點餐
                          </div>
                        ):(
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"8px"}}>
                            {g.orders.map((order,oi)=>(
                              <div key={oi} style={{background:"#fdfaf4",borderRadius:"12px",padding:"12px",border:"1px solid #ddd0bc"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                                    <span style={{fontSize:"16px",fontWeight:"700",color:"#8a5210"}}>{order.num}號</span>
                                    <span style={{fontSize:"12px",color:"#4a3520",fontWeight:"600"}}>{order.guestName}</span>
                                  </div>
                                  <button onClick={()=>setGroups(p=>p.map(x=>x.id!==g.id?x:{...x,orders:x.orders.filter((_,i)=>i!==oi)}))}
                                    style={{fontSize:"9px",padding:"2px 7px",borderRadius:"5px",background:"none",border:"1px solid #7a3030",color:"#e87a5a",cursor:"pointer"}}>取消</button>
                                </div>
                                {order.lines?.map((line,li)=>{
                                  const item=findItem(line.itemId);
                                  if(!item) return null;
                                  return(
                                    <div key={li} style={{marginBottom:"4px"}}>
                                      <div style={{fontSize:"10px",color:"#2a7a4a",fontWeight:"700",marginBottom:"1px"}}>{"["+getItemCategory(item)+"]"}</div>
                                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px"}}>
                                        <span style={{color:"#6a4a2e"}}>{item.name}</span>
                                        <span style={{color:"#7a5c3e"}}>${getItemPrice(item,g.memberType!=="none")}</span>
                                      </div>
                                      {(line.dressing||line.ice||line.sugar||line.mascot||(line.toggles&&line.toggles.length))&&(
                                        <div style={{fontSize:"10px",color:"#6a4c30"}}>
                                          {[line.dressing,line.ice,line.sugar,line.mascot,...(line.toggles||[])].filter(Boolean).join(" · ")}
                                        </div>
                                      )}
                                      {line.setMeal&&(
                                        <div style={{fontSize:"10px",color:"#4a7a4a",marginTop:"2px"}}>
                                          {SET_MEALS.find(s=>s.id===line.setMeal.id)?.label}
                                          {["A","C"].includes(line.setMeal.id)&&line.setMeal.veggieSoup&&<span style={{color:"#dfeadf",fontWeight:"800",background:"#5fe08a",borderRadius:"3px",padding:"0 5px",marginLeft:"4px"}}>🌿素湯</span>}
                                          {line.setMeal.drink&&` · ${line.setMeal.drink.name}`}
                                          {line.setMeal.drink?.ice&&` · ${line.setMeal.drink.ice}`}
                                          {line.setMeal.drink?.sugar&&` · ${line.setMeal.drink.sugar}`}
                                          {line.setMeal.drink?.mascot&&` · ${line.setMeal.drink.mascot}`}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <div style={{borderTop:"1px solid #ddd0bc",marginTop:"6px",paddingTop:"6px",textAlign:"right",fontSize:"12px",color:"#8a5210",fontWeight:"700"}}>
                                  ${orderTotal(order.lines||[],g.memberType!=="none")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{padding:"6px 14px",background:"#0a0601",borderTop:"1px solid #f0e8d8",display:"flex",gap:"10px",flexWrap:"wrap"}}>
        {[["#f5d5d5","🚨逾期"],["#f5e5d0","⚠待付"],["#fdfaf4","進行中"],["#dce8dc","封存"],["#ece8e0","已過餐"],["#f0dcdc","取消"]].map(([bg,label])=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:"4px"}}>
            <div style={{width:10,height:10,background:bg,border:"1px solid #c8b89c",borderRadius:2}}/>
            <span style={{fontSize:"9px",color:"#5a3a28"}}>{label}</span>
          </div>
        ))}
      </div>

      {showHoliday&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowHoliday(false)}>
          <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"18px",width:"100%",maxWidth:"320px",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"14px",color:"#a05a20",fontWeight:"700",marginBottom:"4px",textAlign:"center"}}>國定假日管理（農曆）</div>
            <div style={{fontSize:"11px",color:"#8a6a4a",textAlign:"center",marginBottom:"10px"}}>元旦/228/清明/勞動/國慶等已自動，這裡補春節/端午/中秋等農曆假日</div>
            <div style={{fontSize:"11px",color:"#6a4a2e",marginBottom:"8px"}}>已設定（用餐前一天12:00截止）：</div>
            {customHolidays.length===0&&<div style={{fontSize:"12px",color:"#b0a090",textAlign:"center",padding:"8px"}}>尚未新增</div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"10px"}}>
              {customHolidays.map(h=>(
                <div key={h} style={{display:"flex",alignItems:"center",gap:"4px",background:"#f0e8d6",borderRadius:"8px",padding:"4px 8px"}}>
                  <span style={{fontSize:"13px",color:"#4a3520",fontWeight:"700"}}>{h}</span>
                  <span onClick={()=>saveHolidays(customHolidays.filter(x=>x!==h))} style={{cursor:"pointer",color:"#b05050",fontSize:"14px",fontWeight:"700"}}>×</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <input value={newHoliday} onChange={e=>setNewHoliday(e.target.value)} placeholder="如 2/17"
                style={{flex:1,padding:"9px 12px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"13px"}}/>
              <button onClick={()=>{const h=newHoliday.trim();if(!/^\d{1,2}\/\d{1,2}$/.test(h)||customHolidays.includes(h))return;saveHolidays([...customHolidays,h]);setNewHoliday("");}}
                style={{padding:"9px 14px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>新增</button>
            </div>
            <button onClick={()=>setShowHoliday(false)} style={{width:"100%",marginTop:"12px",padding:"9px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",cursor:"pointer"}}>關閉</button>
          </div>
        </div>
      )}
      {showStaff&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowStaff(false)}>
          <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"18px",width:"100%",maxWidth:"300px",border:"1px solid #d0c0a8"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"14px",color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>夥伴名單管理</div>
            {staffList.map(n=>(
              <div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#f0e8d6",borderRadius:"10px",marginBottom:"6px"}}>
                <span style={{fontSize:"13px",color:"#4a3520",fontWeight:"700"}}>{n}</span>
                <button onClick={()=>{if(staffList.length<=1)return;saveStaff(staffList.filter(x=>x!==n));}}
                  style={{background:"none",border:"1px solid #d4a0a0",borderRadius:"6px",color:"#b05050",fontSize:"11px",cursor:"pointer",padding:"2px 8px"}}>刪除</button>
              </div>
            ))}
            <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
              <input value={newStaff} onChange={e=>setNewStaff(e.target.value)} placeholder="新夥伴名字"
                style={{flex:1,padding:"9px 12px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"13px"}}/>
              <button onClick={()=>{const n=newStaff.trim();if(!n||staffList.includes(n))return;saveStaff([...staffList,n]);setNewStaff("");}}
                style={{padding:"9px 14px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>新增</button>
            </div>
            <button onClick={()=>setShowStaff(false)} style={{width:"100%",marginTop:"12px",padding:"9px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",cursor:"pointer"}}>關閉</button>
          </div>
        </div>
      )}
      {wOpen&&createPortal(
        <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",padding:"16px"}} onClick={()=>setWOpen(false)}>
          <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"420px",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"17px",color:"#a04020",fontWeight:"800",marginBottom:"3px"}}>⚠ 散客客訴</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",marginBottom:"12px"}}>沒訂位的現場客人。記錄綁電話,之後同一支電話訂位會自動出現 ⚠客訴 提醒。</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
              <input value={wForm.phone} onChange={e=>setWForm(p=>({...p,phone:e.target.value}))} placeholder="電話(必填)" inputMode="tel"
                style={{flex:1.3,padding:"11px 12px",borderRadius:"10px",border:"1.5px solid #c9a45c",background:"#fff",color:"#2e2010",fontSize:"15px",fontWeight:"700"}}/>
              <input value={wForm.name} onChange={e=>setWForm(p=>({...p,name:e.target.value}))} placeholder="姓名(選填)"
                style={{flex:1,padding:"11px 12px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"15px"}}/>
            </div>
            {[["原因","reason"],["態度","attitude"],["如何調整","adjust"],["下次用餐招待什麼","treat"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:"10px"}}>
                <div style={{fontSize:"12px",color:"#5a3a28",marginBottom:"4px",fontWeight:"700"}}>{l}</div>
                <textarea value={wForm[k]} onChange={e=>setWForm(p=>({...p,[k]:e.target.value}))} rows={2}
                  style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:"10px",border:"1.5px solid #c9a45c",background:"#fff",color:"#2e2010",fontSize:"14px",lineHeight:"1.5",resize:"vertical",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:"8px",marginTop:"4px",marginBottom:"12px"}}>
              <button onClick={()=>setWOpen(false)} style={{flex:1,padding:"12px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>取消</button>
              <button onClick={()=>{
                  if(normPhone(wForm.phone).length<6){ window.alert("電話要填(至少6碼),客訴才能綁得住"); return; }
                  const now=new Date();
                  const rec={id:`w${Date.now()}`,date:`${now.getMonth()+1}/${now.getDate()}`,...wForm};
                  const nl=[...walkinCpl,rec];
                  setWalkinCpl(nl); FS.saveDoc("walkinCpl",nl);
                  setWOpen(false);
                }}
                style={{flex:2,padding:"12px",borderRadius:"10px",background:"#a04020",border:"none",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer"}}>儲存客訴</button>
            </div>
            {walkinCpl.length>0&&(
              <div style={{borderTop:"1px solid #e8dcc0",paddingTop:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:"800",color:"#8a5a30",marginBottom:"5px"}}>最近散客客訴(共 {walkinCpl.length} 筆)</div>
                {[...walkinCpl].reverse().slice(0,6).map(c=>(
                  <div key={c.id} style={{display:"flex",gap:"8px",alignItems:"center",fontSize:"11px",color:"#5a4030",padding:"5px 0",borderBottom:"1px solid #f0e8d6"}}>
                    <span style={{flex:1,lineHeight:"1.5"}}><b>{c.date}</b> {c.phone} {c.name||""}｜{c.reason||"—"}</span>
                    <button onClick={()=>{const nl=walkinCpl.filter(x=>x.id!==c.id);setWalkinCpl(nl);FS.saveDoc("walkinCpl",nl);}}
                      style={{border:"1px solid #d4a0a0",background:"none",borderRadius:"6px",color:"#b05050",fontSize:"10px",cursor:"pointer",padding:"1px 8px",flexShrink:0}}>刪</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"20px",border:"1px solid #d0c0a8",maxWidth:"400px",margin:"0 auto"}}>
            <div style={{...S.logo,marginBottom:"14px"}}>新增大訂</div>
            {[["姓名 *","name"],["電話","phone"],["日期（如5/3）","date"],["時間（如12:30）","time"],["訂位日","bookDate"],["備註","note"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:"8px"}}>
                <div style={{fontSize:"10px",color:"#5a3a28",marginBottom:"3px"}}>{l}</div>
                <input value={newG[k]||""} onChange={e=>setNewG(p=>({...p,[k]:e.target.value}))} style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",padding:"9px 12px",fontSize:"13px"}}/>
              </div>
            ))}
            {(()=>{
              const ph=normPhone(newG.phone);
              if(ph.length<6) return null;
              const hits=groups.filter(g2=>normPhone(g2.phone)===ph&&(g2.complaints||[]).length>0);
              if(hits.length===0) return null;
              return (
                <div style={{background:"#fce8e0",border:"1.5px solid #d08060",borderRadius:"10px",padding:"10px 12px",marginBottom:"10px"}}>
                  <div style={{fontSize:"12px",color:"#a04020",fontWeight:"700",marginBottom:"4px"}}>⚠ 此電話有客訴記錄！</div>
                  {hits.flatMap(g2=>g2.complaints||[]).slice(0,3).map((it,i2)=>(
                    <div key={i2} style={{fontSize:"11px",color:"#7a4030",lineHeight:"1.6"}}>{it.date}　{it.reason||""} {it.attitude?`／態度：${it.attitude}`:""} {(it.adjust||it.note)?`／調整：${it.adjust||it.note}`:""} {it.treat?`／招待：${it.treat}`:""}</div>
                  ))}
                </div>
              );
            })()}
            {/* 人數選擇 P/C/S */}
            <div style={{marginBottom:"10px"}}>
              <div style={{fontSize:"10px",color:"#5a3a28",marginBottom:"5px"}}>人數（p=人 c=兒童椅 s=兒童餐具）</div>
              <div style={{display:"flex",gap:"8px"}}>
                <div style={{flex:2}}>
                  <div style={{fontSize:"9px",color:"#7a5c3e",marginBottom:"3px"}}>大人 P</div>
                  <input type="number" min="0" value={newG.hcP||""} onChange={e=>setNewG(p=>({...p,hcP:e.target.value}))}
                    placeholder="0" style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",padding:"8px",fontSize:"14px",textAlign:"center"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"9px",color:"#7a5c3e",marginBottom:"3px"}}>兒童椅 C</div>
                  <select value={newG.hcC||0} onChange={e=>setNewG(p=>({...p,hcC:e.target.value}))}
                    style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",padding:"8px 4px",fontSize:"13px"}}>
                    {[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"9px",color:"#7a5c3e",marginBottom:"3px"}}>餐具 S</div>
                  <select value={newG.hcS||0} onChange={e=>setNewG(p=>({...p,hcS:e.target.value}))}
                    style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",padding:"8px 4px",fontSize:"13px"}}>
                    {[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {/* 包廂勾選 */}
            <div onClick={()=>setNewG(p=>({...p,isVip:!p.isVip}))}
              style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"10px",cursor:"pointer",marginBottom:"10px",
                background:newG.isVip?"#2a1a3a":"#f0e8d6",border:`1.5px solid ${newG.isVip?"#8a5ab4":"#d8c8b0"}`}}>
              <div style={{width:"20px",height:"20px",borderRadius:"5px",border:`2px solid ${newG.isVip?"#8a5ab4":"#5a3a28"}`,
                background:newG.isVip?"#8a5ab4":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {newG.isVip&&<span style={{color:"#fff",fontSize:"12px"}}>✓</span>}
              </div>
              <span style={{fontSize:"13px",fontWeight:"700",color:newG.isVip?"#c8a0e0":"#7a5c3e"}}>包廂訂位（需訂金）</span>
            </div>
            {/* 訂金區:條件顯示 */}
            {(()=>{
              const tp=(parseInt(newG.hcP)||0)+(parseInt(newG.hcC)||0)+(parseInt(newG.hcS)||0);
              const show = tp>=10 || newG.isVip;
              if(!show) return <div style={{fontSize:"10px",color:"#5a3a28",padding:"7px 10px",background:"#f0e8d6",borderRadius:"8px",marginBottom:"10px"}}>人數未達10人且非包廂，免付訂金</div>;
              return (
                <div style={{background:"#f0e8d6",borderRadius:"10px",padding:"10px 12px",marginBottom:"10px",border:"1px solid #5a3a10"}}>
                  <div style={{fontSize:"10px",color:"#8a5210",fontWeight:"700",marginBottom:"8px"}}>💰 訂金資訊（必填）</div>
                  {[["訂金金額","deposit"],["付訂日","depositDate"],["收款人","collector"]].map(([l,k])=>(
                    <div key={k} style={{marginBottom:"7px"}}>
                      <div style={{fontSize:"10px",color:"#5a3a28",marginBottom:"3px"}}>{l}</div>
                      <input value={newG[k]||""} onChange={e=>setNewG(p=>({...p,[k]:e.target.value}))} style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",padding:"8px 12px",fontSize:"13px"}}/>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"10px",color:"#5a3a28",marginBottom:"6px"}}>整組會員身份</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {[["existing","✦ 會員","#3d2a10","#c4924a"],["new","★ 現場入會","#1a3d2a","#2a7a4a"],["none","○ 非會員","#f0e8d8","#7a5c3e"]].map(([val,label,bg,col])=>(
                  <div key={val} onClick={()=>setNewG(p=>({...p,memberType:val}))}
                    style={{padding:"9px 12px",borderRadius:"10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
                      background:newG.memberType===val?bg:"#140b04",border:`1.5px solid ${newG.memberType===val?col:"#ddd0bc"}`}}>
                    <span style={{fontSize:"13px",fontWeight:"700",color:newG.memberType===val?col:"#5a3a28"}}>{label}</span>
                    {newG.memberType===val&&<span style={{color:col}}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{fontSize:"10px",color:"#2a7a4a",padding:"8px 10px",background:"#e2f2e8",borderRadius:"8px",marginBottom:"12px"}}>
              📌 新增後系統自動產生3位數點餐代碼，傳給客人即可點餐
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setShowAdd(false)} style={{...S.ghostBtn,flex:1,margin:0,padding:"10px"}}>取消</button>
              <button onClick={()=>{
                if(!newG.name.trim()) return;
                const code=makeCode(groups.map(g=>g.code));
                const hp=parseInt(newG.hcP)||0, hc2=parseInt(newG.hcC)||0, hs=parseInt(newG.hcS)||0;
                const headcount=[hp>0?hp+"p":"",hc2>0?hc2+"c":"",hs>0?hs+"s":""].filter(Boolean).join("")||newG.headcount||"";
                setGroups(p=>[...p,{...BLANK_G,...newG,headcount,id:`g${Date.now()}`,code,orders:[],disabledItems:[],locked:false}]);
                setNewG({...BLANK_G});
                setShowAdd(false);
                showToast(`已新增 ${newG.name}，代碼：${code}`);
              }} style={{...S.primaryBtn,flex:2,padding:"10px"}}>新增並產生代碼</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ─── DINGWE TABLE ─────────────────────────────────────────────────────────────
const TIMES = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30",
               "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
               "18:00","18:30","19:00","19:30"];
const DAYS = ["一","二","三","四","五","六","日"];


function getWeekDates(offset=0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day===0?6:day-1) + offset*7);
  return Array.from({length:7},(_,i)=>{
    const d = new Date(mon);
    d.setDate(mon.getDate()+i);
    return `${d.getMonth()+1}/${d.getDate()}`;
  });
}

function parsePeople(headcount) {
  if(!headcount) return {total:0,adults:0,children:0};
  const hc = headcount.toLowerCase();
  const p=(hc.match(/(\d+)p/)||[])[1]||(hc.match(/^(\d+)$/)||[])[1]||0;
  const c=(hc.match(/(\d+)c/)||[])[1]||0;
  const adults=parseInt(p)||0, children=parseInt(c)||0;
  return {total:adults+children, adults, children};
}

function CloseCell({ cellKey, closeMap, setCloseMap, staffList }) {
  const [open, setOpen] = useState(false);
  const closer = closeMap[cellKey];
  return (
    <div style={{position:"relative"}}>
      {open&&<div style={{position:"fixed",inset:0,zIndex:50}} onClick={()=>setOpen(false)}/>}
      <div onClick={()=>setOpen(p=>!p)}
        style={{cursor:"pointer",fontSize:"10px",color:closer?"#1a6a1a":"#aaa",
          fontWeight:closer?"700":"400",background:closer?"#e0f0e0":"transparent",
          borderRadius:"3px",padding:"2px 3px",textAlign:"center",minWidth:"30px"}}>
        {closer?(typeof closer==="object"?closer.by:closer):"—"}
      </div>
      {open&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:300,background:"#fdfaf4",
          border:"1px solid #5a3520",borderRadius:"8px",padding:"4px",minWidth:"80px",
          boxShadow:"0 4px 12px rgba(0,0,0,0.5)"}}>
          {(staffList||DEFAULT_STAFF).map(name=>(
            <div key={name} onClick={()=>{setCloseMap(p=>({...p,[cellKey]:name}));setOpen(false);}}
              style={{padding:"6px 10px",cursor:"pointer",fontSize:"12px",color:"#8a5210",borderRadius:"4px"}}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {name}
            </div>
          ))}
          <div onClick={()=>{setCloseMap(p=>{const n={...p};delete n[cellKey];return n;});setOpen(false);}}
            style={{padding:"4px 10px",cursor:"pointer",fontSize:"10px",color:"#e87a5a",
              borderTop:"1px solid #d8c8b0",marginTop:"2px"}}>清除</div>
        </div>
      )}
    </div>
  );
}


function StaffPicker({ onSelect, onClose, staffList }) {
  const sl = (staffList&&staffList.length>0)?staffList:["佩霓","TINA","07","佑庭","大銘"];
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)"}} onClick={onClose}>
      <div style={{background:"#fdfaf4",border:"1px solid #5a3520",borderRadius:"16px",padding:"16px 12px",minWidth:"150px",maxWidth:"200px"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"12px",color:"#8a5210",fontWeight:"700",marginBottom:"10px",textAlign:"center"}}>選擇夥伴</div>
        {sl.map(name=>(
          <div key={name} onClick={()=>onSelect(name)}
            style={{padding:"10px 14px",cursor:"pointer",fontSize:"14px",color:"#8a5210",borderRadius:"8px",textAlign:"center",marginBottom:"4px",background:"#ffffff"}}>
            {name}
          </div>
        ))}
        <div onClick={onClose} style={{padding:"8px",cursor:"pointer",fontSize:"11px",color:"#e87a5a",borderTop:"1px solid #d8c8b0",marginTop:"6px",textAlign:"center"}}>取消</div>
      </div>
    </div>
  );
}

function DingwePage({ groups, onBack, staffList, setGroups }) {
  const RED_AT=20, YEL_AT=15; // 紅:20+ 黃:15-19
  const TIMES2 = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"];
  const DAYS2 = ["一","二","三","四","五","六","日"];
  const [weekOffset, setWeekOffset] = useState(0);
  const [closeMap, setCloseMap] = useState({});
  const [peopleMap, setPeopleMap] = useState({}); // {key:{a,ch,by,at}}
  const [progress, setProgress] = useState(null); // {by,at,status,lastDate}
  const [viewDay, setViewDay] = useState(null);
  const [dupOpen, setDupOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window!=="undefined"&&window.innerWidth<640);
  const [editCell, setEditCell] = useState(null); // {key,a,ch,autoT}
  const [closePicker, setClosePicker] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishStatus, setFinishStatus] = useState(null); // "complete"|"partial"
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // {count,slots,at,by}
  const [importStaff, setImportStaff] = useState(null); // 待選夥伴的暫存 parsed data
  const fileInputRef = useRef(null);
  const [mismatchList, setMismatchList] = useState(null);
  const sessionKeys = useRef([]);

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<640);
    window.addEventListener("resize",fn); return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    FS.loadDoc("dingwe").then(v=>{ if(v){ if(v.peopleMap)setPeopleMap(v.peopleMap); if(v.closeMap)setCloseMap(v.closeMap); if(v.progress)setProgress(v.progress); if(v.dupReservations)setDupReservations(v.dupReservations); if(v.lastImport!==undefined)setLastImport(v.lastImport); if(v.noReopen)setNoReopen(v.noReopen); } });
    const unsub = FS.subscribeDoc("dingwe", v=>{ if(v){ if(v.peopleMap)setPeopleMap(v.peopleMap); if(v.closeMap)setCloseMap(v.closeMap); if(v.progress!==undefined)setProgress(v.progress); if(v.dupReservations!==undefined)setDupReservations(v.dupReservations); if(v.lastImport!==undefined)setLastImport(v.lastImport); if(v.noReopen!==undefined)setNoReopen(v.noReopen); } });
    return ()=>unsub&&unsub();
  },[]);
  const [dupReservations,setDupReservations]=useState([]);
  const [lastImport,setLastImport]=useState("");
  const [leaveWarn,setLeaveWarn]=useState(false);   // 一三五未關紅單就離開 → 防呆
  const [leaveAck,setLeaveAck]=useState(false);     // 本次已確認不關,不再攔
  const [closeTaskDone,setCloseTaskDone]=useState(false); // 首頁閃燈用的關訂位打勾
  useEffect(()=>{
    const k=`close_${todayStr}`;
    FS.loadDoc("todo").then(d=>{ if(d&&d[k]) setCloseTaskDone(true); });
    const u=FS.subscribeDoc("todo",d=>{ if(d) setCloseTaskDone(!!d[k]); });
    return ()=>u&&u();
  },[]);
  const markCloseDone=()=>{ FS.loadDoc("todo").then(d=>{ const nd={...(d||{}),[`close_${todayStr}`]:true}; FS.saveDoc("todo",nd); setCloseTaskDone(true); }); };
  const [noReopen,setNoReopen]=useState({}); // {date-time:true} = 已確認不開放
  const persistDW=(pm,cm,pg,dup,li,nr)=>FS.saveDoc("dingwe",{peopleMap:pm,closeMap:cm,progress:pg,dupReservations:dup!==undefined?dup:dupReservations,lastImport:li!==undefined?li:lastImport,noReopen:nr!==undefined?nr:noReopen});
  const toggleNoReopen=(key)=>{ const nn={...noReopen,[key]:!noReopen[key]}; setNoReopen(nn); persistDW(peopleMap,closeMap,progress,undefined,undefined,nn); };
  const [missedPick,setMissedPick]=useState(null);
  // ✕ 移除一筆重複訂位 → 從人數扣掉、重算
  const removeDupItem = (di, rid) => {
    const d = dupReservations[di]; if(!d) return;
    const removed = (d.items||[]).find(it=>it.rid===rid);
    const nd = dupReservations.map((x,idx)=>idx!==di?x:{...x,items:(x.items||[]).filter(it=>it.rid!==rid)})
                              .filter(x=>(x.items||[]).length>1);
    let nm = peopleMap;
    if(removed){
      const key=`${removed.date}-${removed.time}`;
      if(peopleMap[key]){
        nm={...peopleMap,[key]:{...peopleMap[key],
          a:String(Math.max(0,(parseInt(peopleMap[key].a)||0)-removed.a)),
          ch:String(Math.max(0,(parseInt(peopleMap[key].ch)||0)-removed.ch))}};
        setPeopleMap(nm);
      }
    }
    setDupReservations(nd);
    persistDW(nm, closeMap, progress, nd);
  };
  // 未接(記夥伴+時間+累計次數)
  const markMissed = (di, operator) => {
    const now=new Date(); const at=`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const nd=dupReservations.map((x,idx)=>idx!==di?x:{...x,missed:(x.missed||0)+1,missedAt:at,missedBy:operator});
    setDupReservations(nd);
    persistDW(peopleMap,closeMap,progress,nd);
  };

  function getWeekDates2(off=0){
    const now=new Date(),day=now.getDay();
    const mon=new Date(now); mon.setDate(now.getDate()-(day===0?6:day-1)+off*7);
    return Array.from({length:7},(_,i2)=>{const d=new Date(mon);d.setDate(mon.getDate()+i2);return `${d.getMonth()+1}/${d.getDate()}`;});
  }
  const weekDates = getWeekDates2(weekOffset);
  const today = new Date(); today.setHours(0,0,0,0);
  const oneMonthLater = new Date(today); oneMonthLater.setMonth(today.getMonth()+1);
  const todayStr = `${today.getMonth()+1}/${today.getDate()}`;

  // 手機預設只看今天
  useEffect(()=>{
    if(isMobile&&viewDay===null&&weekOffset===0){
      const idx = weekDates.indexOf(todayStr);
      if(idx>=0) setViewDay(idx);
    }
  },[isMobile]);

  function dOf(ds){ const[m,d]=ds.split("/").map(Number); let x=new Date(today.getFullYear(),m-1,d); if(x<today&&(today-x)>1000*60*60*24*180) x=new Date(today.getFullYear()+1,m-1,d); return x; }
  function inRange(ds){ const d=dOf(ds); return d>=today && d<=oneMonthLater; }

  const getSlotGroups=(date,time)=>(groups||[]).filter(g=>!g.cancelled&&!(g.archived&&g.archiveType!=="menu"&&g.archiveType)&& !(g.archived&&!g.archiveType) &&(g.date||"").trim()===date&&(g.time||"").trim()===time);
  const getSlotGroups2=(date,time)=>(groups||[]).filter(g=>!g.cancelled&&(!g.archived)&&(g.date||"").trim()===date&&(g.time||"").trim()===time);

  function parsePpl(hc){
    if(!hc) return {total:0,adults:0,children:0};
    const h=hc.toLowerCase();
    const p=parseInt((h.match(/(\d+)p/)||[])[1])||parseInt(h)||0;
    const ch=parseInt((h.match(/(\d+)c/)||[])[1])||0;
    return {total:p+ch,adults:p,children:ch};
  }

  const saveCell=(key,a,ch)=>{
    setPeopleMap(p=>{
      const n={...p};
      if((a===""||a===undefined)&&(ch===""||ch===undefined)){ delete n[key]; }
      else n[key]={...(n[key]||{}),a:a||"0",ch:ch||"0"};
      persistDW(n,closeMap,progress);
      return n;
    });
    if(!sessionKeys.current.includes(key)) sessionKeys.current.push(key);
    setEditCell(null);
  };

  const finishSession=(staffName)=>{
    const now=new Date();
    const at=`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    // 本輪關到哪:以「關訂位的格子(closeMap)最後日期」為準
    let lastDate = (progress&&progress.lastDate)||todayStr;
    const closedDates = Object.keys(closeMap).map(k=>k.split("-")[0]);
    if(closedDates.length>0){
      closedDates.sort((x,y)=>dOf(x)-dOf(y));
      lastDate = closedDates[closedDates.length-1];
    }
    // 輪次:上一輪已完成→開新一輪;未完成→延續同一輪
    const round = progress ? (progress.status==="complete" ? (progress.round||1)+1 : (progress.round||1)) : 1;
    const pg = {by:staffName,at,status:finishStatus,lastDate,round};
    setProgress(pg);
    if(finishStatus==="complete") markCloseDone&&markCloseDone();
    // 把這次 key 的格子標記夥伴+時間
    setPeopleMap(p=>{
      const n={...p};
      sessionKeys.current.forEach(k=>{ if(n[k]) n[k]={...n[k],by:staffName,at}; });
      persistDW(n,closeMap,pg);
      return n;
    });
    sessionKeys.current=[];
    setFinishOpen(false); setFinishStatus(null);
  };

  const jumpToUnkeyed=()=>{
    if(!progress||!progress.lastDate) return;
    const target=dOf(progress.lastDate); target.setDate(target.getDate()+1);
    if(target>oneMonthLater) return;
    // 計算該日期所在週的 offset
    const now=new Date(),day=now.getDay();
    const mon=new Date(now); mon.setDate(now.getDate()-(day===0?6:day-1)); mon.setHours(0,0,0,0);
    const diff=Math.floor((target-mon)/(7*24*60*60*1000));
    setWeekOffset(diff);
    const wd=getWeekDates2(diff);
    const ts=`${target.getMonth()+1}/${target.getDate()}`;
    const idx=wd.indexOf(ts);
    setViewDay(idx>=0?idx:null);
  };

  const normDate = (s) => {
    const m=String(s).match(/(\d{1,2})[\/-](\d{1,2})/);
    return m?`${parseInt(m[1])}/${parseInt(m[2])}`:String(s).trim();
  };
  const normTime = (s) => {
    const m=String(s).match(/(\d{1,2}):(\d{2})/);
    return m?`${m[1].padStart(2,"0")}:${m[2]}`:String(s).trim();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {type:"array"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {header:1});
      // 找標題列
      let hi=-1, di=-1, ti=-1, pi=-1, si=-1, sti=-1, nti=-1, dti=-1;
      for(let r=0;r<Math.min(rows.length,5);r++){
        const row=rows[r].map(x=>String(x||""));
        const d=row.findIndex(x=>x.includes("訂位日期")||x.includes("日期"));
        if(d>=0){ hi=r; di=d;
          ti=row.findIndex(x=>x.includes("時間")&&!x.includes("下訂")&&!x.includes("更新"));
          pi=row.findIndex(x=>x.includes("人數")&&!x.includes("開桌"));
          si=row.findIndex(x=>x.includes("狀態"));
          sti=row.findIndex(x=>x.includes("預訂桌位")||x.includes("桌位"));
          nti=row.findIndex(x=>x.includes("店家備註"));
          dti=row.findIndex(x=>x.includes("下訂時間"));
          break;
        }
      }
      if(hi<0){ alert("找不到標題列（需有「訂位日期」欄）"); setImporting(false); return; }
      // 彙總(同電話＋同日期＋同時段的多筆 = 改訂位 → 只留「最新一筆」,人數不灌水、大訂不重複)
      const parseTS=(v)=>{ if(!v) return 0; if(v instanceof Date) return v.getTime(); const mm=String(v).match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T]?(\d{0,2}):?(\d{0,2})/); return mm?new Date(+mm[1],+mm[2]-1,+mm[3],+(mm[4]||0),+(mm[5]||0)).getTime():0; };
      const dedupe={};   // phone|date|time -> 最新一筆(計人數用)
      const noPhone=[];  // 沒抓到電話的,各自獨立保留
      const rawList=[];  // 每一筆原始訂位(不合併)→ 給「重複訂位」提醒用
      const cancelMap={}; // 取消的訂位 phone|date|time -> {name,date,time,phone}
      for(let r=hi+1;r<rows.length;r++){
        const row=rows[r]; if(!row||!row[di]) continue;
        const status=si>=0?String(row[si]||""):"";
        const date=normDate(row[di]);
        const time=normTime(row[ti]);
        const pStr=String(row[pi]||"");
        const m=pStr.match(/大人\s*(\d+).*?小孩\s*(\d+)/);
        const a=m?parseInt(m[1]):(parseInt(pStr)||0);
        const ch=m?parseInt(m[2]):0;
        const phone=(()=>{ for(let cc=0;cc<row.length;cc++){const s=String(row[cc]||"");if(/^09\d{8}$/.test(s.replace(/\D/g,""))) return s.replace(/\D/g,""); } return ""; })();
        const nameCol = row[di+2]!==undefined?String(row[di+2]||""):"";
        // 取消/未到:不計入人數與大訂,但記下來 → 用來自動封存對應的大訂
        if(status.includes("取消")||status.includes("未到")){
          if(phone) cancelMap[`${phone}|${date}|${time}`]={name:nameCol||"(未填)",date,time,phone};
          continue;
        }
        const tableCol = sti>=0?String(row[sti]||""):"";
        const noteCol = nti>=0?String(row[nti]||""):"";
        const isVip = tableCol.includes("包廂") && !noteCol.includes("取消包廂");
        const orderTS=(dti>=0&&row[dti])?parseTS(row[dti]):0;
        let orderAt="";
        if(dti>=0&&row[dti]){
          const dv=row[dti]; let d2;
          if(dv instanceof Date) d2=dv;
          else { const s=String(dv); const mm=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/); if(mm) d2=new Date(+mm[1],+mm[2]-1,+mm[3]); }
          if(d2) orderAt=`${d2.getMonth()+1}/${d2.getDate()}`;
        }
        const rec={date,time,a,ch,phone,name:nameCol||"(未填)",isVip,orderAt,orderTS};
        if(phone){
          rawList.push(rec);   // 原始(不合併)
          const k=`${phone}|${date}|${time}`;
          if(!dedupe[k] || orderTS>=dedupe[k].orderTS) dedupe[k]=rec;   // 計人數:同時段留最新
        } else noPhone.push(rec);
      }
      const allRaw=[...rawList,...noPhone];                  // 計人數:全部算(重複由夥伴按✕移除)
      const allDedup=[...Object.values(dedupe),...noPhone];  // 大訂候選:同時段去重
      // 依時段彙總人數(全部算)
      const agg={};
      allRaw.forEach(rec=>{ const key=`${rec.date}-${rec.time}`; if(!agg[key]) agg[key]={a:0,ch:0}; agg[key].a+=rec.a; agg[key].ch+=rec.ch; });
      const cnt=allRaw.length;
      // ≥8 大人 → 大訂候選(去重)
      const bigOrders=allDedup.filter(rec=>rec.a>=8 || rec.isVip).map(rec=>({date:rec.date,time:rec.time,name:rec.name,phone:rec.phone,adults:rec.a,children:rec.ch,isVip:rec.isVip,orderAt:rec.orderAt}));
      // 重複訂位:同一支電話有多筆 → 結構化存,讓夥伴可按✕移除(人數自動重算)
      const byPhone={};
      rawList.forEach(rec=>{ (byPhone[rec.phone]=byPhone[rec.phone]||[]).push(rec); });
      const dupWarn=Object.entries(byPhone).filter(([p,rs])=>rs.length>1)
        .map(([p,rs])=>({
          phone:p, name:rs[0].name, missed:0, missedAt:"",
          items: rs.sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time)).map((x,i)=>({rid:`${p}_${x.date}_${x.time}_${x.a}_${x.ch}_${i}`, date:x.date, time:x.time, a:x.a, ch:x.ch}))
        }));
      // 取消 → 自動封存對應大訂(取消的時段、且沒有同時段的有效訂位才封存)
      const activeSet=new Set(allDedup.filter(rc=>rc.phone).map(rc=>`${rc.phone}|${rc.date}|${rc.time}`));
      const toArchive=[];
      (groups||[]).forEach(g=>{
        if(g.archived||g.cancelled) return;
        const k=`${(g.phone||"").replace(/\D/g,"")}|${(g.date||"").trim()}|${(g.time||"").trim()}`;
        if(cancelMap[k] && !activeSet.has(k)) toArchive.push({id:g.id,name:g.name||cancelMap[k].name,date:g.date,time:g.time});
      });
      // 比對既有大訂,算新訂位數與變動數
      let newC2=0, changedC2=0;
      const curG = groups||[];
      bigOrders.forEach(bo=>{
        const eg=curG.find(g=>(g.phone||"").replace(/\D/g,"")===bo.phone&&(g.date||"").trim()===bo.date&&(g.time||"").trim()===bo.time);
        if(!eg){ newC2++; }
        else {
          const h=(eg.headcount||"").toLowerCase();
          const oa=parseInt((h.match(/(\d+)p/)||[])[1])||0, oc=parseInt((h.match(/(\d+)c/)||[])[1])||0;
          if(oa!==bo.adults||oc!==bo.children) changedC2++;
        }
      });
      setImportStaff({agg,cnt,slots:Object.keys(agg).length,bigOrders,newCount:newC2,changedCount:changedC2,dupWarn,toArchive});
    } catch(err) {
      alert("讀取失敗："+err.message);
    }
    setImporting(false);
    if(fileInputRef.current) fileInputRef.current.value="";
  };

  const confirmImport = (staffName, forceUpdate=false) => {
    const {agg} = importStaff;
    const now=new Date();
    const at=`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const todayLI=`${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`;
    setLastImport(todayLI);
    // 重複訂位:合併,不要整個蓋掉 → 保留「未接」記錄、已確認的不再跳出來(#2 #6)
    const prevByPhone={}; (dupReservations||[]).forEach(d=>{ prevByPhone[normPhone(d.phone)]=d; });
    const mergedDup=(importStaff.dupWarn||[])
      .filter(d=>{ const pv=prevByPhone[normPhone(d.phone)]; return !(pv&&pv.confirmed); })
      .map(d=>{ const pv=prevByPhone[normPhone(d.phone)]; return pv?{...d,missed:pv.missed,missedAt:pv.missedAt,missedBy:pv.missedBy,confirmed:pv.confirmed}:d; });
    setPeopleMap(p=>{
      const n={...p};
      Object.entries(agg).forEach(([key,v])=>{
        n[key]={a:String(v.a),ch:String(v.ch),by:staffName,at,src:"麥"};
      });
      persistDW(n,closeMap,progress,mergedDup,todayLI);
      return n;
    });
    setDupReservations(mergedDup);
    // 匯入 ≥8 大人的大訂到追蹤表(去重 + 人數變動偵測)— 先在外面算好
    const mismatches=[];
    const toAdd=[];
    if(importStaff.bigOrders&&importStaff.bigOrders.length>0&&setGroups){
      const cur=groups||[];
      importStaff.bigOrders.forEach(bo=>{
        const eg=cur.find(g=>(g.phone||"").replace(/\D/g,"")===bo.phone&&(g.date||"").trim()===bo.date&&(g.time||"").trim()===bo.time);
        if(eg){
          const h=(eg.headcount||"").toLowerCase();
          const oldA=parseInt((h.match(/(\d+)p/)||[])[1])||0;
          const oldC=parseInt((h.match(/(\d+)c/)||[])[1])||0;
          if(oldA!==bo.adults||oldC!==bo.children){
            mismatches.push({name:eg.name,phone:bo.phone,date:bo.date,time:bo.time,oldA,oldC,newA:bo.adults,newC:bo.children,id:eg.id});
          }
        } else {
          toAdd.push(bo);
        }
      });
      if(toAdd.length>0){
        setGroups(prev=>{
          let next=[...prev];
          toAdd.forEach((bo,i)=>{
            const code=makeCode(next.map(g=>g.code));
            const headcount=[bo.adults>0?bo.adults+"p":"",bo.children>0?bo.children+"c":""].filter(Boolean).join("");
            const needsDep = needsDeposit(headcount, bo.isVip);
            next=[...next,{...BLANK_G,id:`g${Date.now()}_${i}`,code,name:bo.name,phone:bo.phone,date:bo.date,time:bo.time,headcount,bookDate:(bo.orderAt||""),
              isVip:!!bo.isVip, depositDate:"",
              orders:[],disabledItems:[],locked:false,fromMai:true}];
          });
          return next;
        });
      }
    }
    // 取消的訂位 → 自動封存對應大訂
    if(importStaff.toArchive && importStaff.toArchive.length>0 && setGroups){
      const aids=new Set(importStaff.toArchive.map(t=>t.id));
      setGroups(prev=>prev.map(g=>aids.has(g.id)?{...g,archived:true,cancelled:true,archiveType:"cancelled"}:g));
    }
    const added=toAdd.length;
    if(forceUpdate && mismatches.length>0){
      // 全部更新:直接套用大麥人數
      setGroups(prev=>prev.map(g=>{
        const mm=mismatches.find(m=>m.id===g.id);
        if(!mm) return g;
        const hc=[mm.newA>0?mm.newA+"p":"",mm.newC>0?mm.newC+"c":""].filter(Boolean).join("");
        return {...g,headcount:hc};
      }));
    } else if(mismatches.length>0){
      setMismatchList(mismatches);
    }
    setImportResult({count:importStaff.cnt,slots:importStaff.slots,at,by:staffName,added,updated:forceUpdate?mismatches.length:0,changed:mismatches.length});
    setImportStaff(null);
    setTimeout(()=>setImportResult(null),4000);
  };

  // 某天:有 ≥20 人時段但該時段沒關訂位 → 警示
  const dayNeedsClose = (dateStr) => {
    // 只提醒「明天(含)以後」還沒關的;當天與過去不提醒(時間過了關了也沒意義)
    const mm=String(dateStr).match(/(\d{1,2})\/(\d{1,2})/);
    if(mm){
      const dd=new Date(today.getFullYear(), +mm[1]-1, +mm[2]);
      if(dd.getTime() < today.getTime()-1000*60*60*24*180) dd.setFullYear(dd.getFullYear()+1); // 跨年保險
      if(dd.getTime() <= today.getTime()) return false;
    }
    return TIMES2.some(time=>{
      const key=`${dateStr}-${time}`;
      const entry=peopleMap[key];
      const sg=(groups||[]).filter(g=>!g.cancelled&&!g.archived&&(g.date||"").trim()===dateStr&&(g.time||"").trim()===time);
      const autoT=sg.reduce((s,g)=>{const h=(g.headcount||"").toLowerCase();const p=parseInt((h.match(/(\d+)p/)||[])[1])||parseInt(h)||0;const ch=parseInt((h.match(/(\d+)c/)||[])[1])||0;return s+p+ch;},0);
      const a=entry?parseInt(entry.a)||0:0, ch=entry?parseInt(entry.ch)||0:0;
      const total=entry?(a+ch):autoT;
      return total>=RED_AT && !closeMap[key];
    });
  };

  const daySlots = (dateStr) => {
    // 回傳該天「需關訂的時段」與「人數掉下來可開放的時段」
    const mm=String(dateStr).match(/(\d{1,2})\/(\d{1,2})/);
    let future=true;
    if(mm){const dd=new Date(today.getFullYear(),+mm[1]-1,+mm[2]);if(dd.getTime()<today.getTime()-1000*60*60*24*180)dd.setFullYear(dd.getFullYear()+1);if(dd.getTime()<=today.getTime())future=false;}
    const needClose=[], canReopen=[];
    if(!future) return {needClose,canReopen};
    TIMES2.forEach(time=>{
      const key=`${dateStr}-${time}`;
      const entry=peopleMap[key];
      const sg=(groups||[]).filter(g=>!g.cancelled&&!g.archived&&(g.date||"").trim()===dateStr&&(g.time||"").trim()===time);
      const autoT=sg.reduce((s,g)=>{const h=(g.headcount||"").toLowerCase();const p=parseInt((h.match(/(\d+)p/)||[])[1])||parseInt(h)||0;const ch=parseInt((h.match(/(\d+)c/)||[])[1])||0;return s+p+ch;},0);
      const a=entry?parseInt(entry.a)||0:0, ch=entry?parseInt(entry.ch)||0:0;
      const total=entry?(a+ch):autoT;
      if(total>=RED_AT && !closeMap[key]) needClose.push(time);
      if(total<RED_AT && closeMap[key]) canReopen.push(time);
    });
    return {needClose,canReopen};
  };

  const daysToShow = (viewDay!==null)?[viewDay]:Array.from({length:7},(_,i2)=>i2);
  const staffOpts = (staffList&&staffList.length>0)?staffList:DEFAULT_STAFF;

  // ── 關訂位防呆 + 步驟指引 ──
  const _dowNow = new Date().getDay();
  const isCloseDay = [1,3,5].includes(_dowNow);            // 一三五 要關訂位
  const _weekDGuard = Array.from({length:7},(_,di)=>weekDates[di]).filter(d=>inRange(d));
  const unclosedRedCnt = _weekDGuard.reduce((s,d)=>s+daySlots(d).needClose.length,0);
  const importedThisWeek = !!lastImport;                    // 有導入紀錄
  // 步驟狀態:1導入 2關紅單 3按完成。current=正在做的那步
  const _doneClosing = progress && progress.status==="complete";
  const stepCur = !importedThisWeek ? 1 : (unclosedRedCnt>0 ? 2 : 3);
  const showSteps = isCloseDay && (stepCur<3 || !_doneClosing);
  const guardedBack = () => {
    if(isCloseDay && !closeTaskDone && !leaveAck){ setLeaveWarn(true); }
    else onBack();
  };

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#f5f0e8",fontFamily:"'Noto Sans TC',sans-serif"}}>
      <style>{"@media print{.np{display:none!important}.dw{overflow:visible!important}table{font-size:8px!important}}"}</style>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleFile}/>
      {importing&&(
        <div style={{position:"fixed",inset:0,zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"}}>
          <div style={{background:"#fdfaf4",borderRadius:"14px",padding:"24px 30px",fontSize:"14px",color:"#6a4a2e",fontWeight:"700"}}>讀取中…</div>
        </div>
      )}
      {importStaff&&(
        <div style={{position:"fixed",inset:0,zIndex:360,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)"}} onClick={()=>setImportStaff(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"20px",width:"280px"}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:"14px",color:"#3a7a5a",fontWeight:"700",marginBottom:"6px",textAlign:"center"}}>📥 大麥匯入確認</div>
            <div style={{fontSize:"12px",color:"#6a4a2e",textAlign:"center",marginBottom:"4px"}}>共 {importStaff.cnt} 筆訂位 → {importStaff.slots} 個時段</div>
            <div style={{fontSize:"13px",color:"#3a7a5a",fontWeight:"700",textAlign:"center",marginBottom:"4px"}}>📋 ≥8人或包廂大訂：{(importStaff.bigOrders||[]).length} 筆</div>
            <div style={{background:"#eaf4ff",border:"1px solid #a8c8e8",borderRadius:"8px",padding:"8px 10px",margin:"6px 0",fontSize:"11px",color:"#2a5a8a",lineHeight:"1.7"}}>
              <b>匯入後下一步:</b><br/>1️⃣ 到大訂表按「📥 麥訂」→ 把大訂「轉一般」<br/>2️⃣ 有重複訂位先確認<br/>3️⃣ 週一三五記得關紅色(滿20)訂位並按「完成關訂位」
            </div>
            {importStaff.dupWarn&&importStaff.dupWarn.length>0&&(
              <div style={{background:"#fbe8d8",border:"1px solid #e0b088",borderRadius:"8px",padding:"8px",margin:"6px 0",maxHeight:"130px",overflowY:"auto"}}>
                <div style={{fontSize:"12px",color:"#b05a10",fontWeight:"700",marginBottom:"4px"}}>⚠ 重複訂位 {importStaff.dupWarn.length} 組（同電話多筆，請確認是否重複下訂）</div>
                {importStaff.dupWarn.map((d,i)=>(
                  <div key={i} style={{fontSize:"10px",color:"#6a4a2e",marginBottom:"3px",lineHeight:"1.4"}}>
                    <b>{d.name}</b>（{d.phone}）<br/>{(d.items||[]).map(it=>`${it.date} ${it.time}（${it.a}大${it.ch}小）`).join("、")}
                  </div>
                ))}
              </div>
            )}
            {importStaff.toArchive&&importStaff.toArchive.length>0&&(
              <div style={{background:"#e6f0e6",border:"1px solid #a8c8a8",borderRadius:"8px",padding:"8px",margin:"6px 0",maxHeight:"110px",overflowY:"auto"}}>
                <div style={{fontSize:"12px",color:"#3a7a5a",fontWeight:"700",marginBottom:"4px"}}>🗄 取消將自動封存 {importStaff.toArchive.length} 筆大訂</div>
                {importStaff.toArchive.map((t,i)=>(
                  <div key={i} style={{fontSize:"10px",color:"#5a6a4a",marginBottom:"2px"}}>{t.name}（{t.date} {t.time}）</div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:"8px",justifyContent:"center",marginBottom:"6px"}}>
              {importStaff.newCount>0&&<span style={{fontSize:"11px",color:"#fff",background:"#3a7a5a",borderRadius:"6px",padding:"2px 8px",fontWeight:"700"}}>🆕 新訂位 {importStaff.newCount}</span>}
              {importStaff.changedCount>0&&<span style={{fontSize:"11px",color:"#fff",background:"#c0392b",borderRadius:"6px",padding:"2px 8px",fontWeight:"700"}}>⚠ 人數變動 {importStaff.changedCount}</span>}
            </div>
            <div style={{fontSize:"11px",color:"#b05a10",textAlign:"center",marginBottom:"12px"}}>※ 人數時段會以大麥為準</div>
            <div style={{fontSize:"12px",color:"#6a4a2e",fontWeight:"700",marginBottom:"8px",textAlign:"center"}}>你是哪位夥伴?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px",justifyContent:"center",marginBottom:"10px"}}>
              {staffOpts.map(n=>(
                <button key={n} onClick={()=>setImportStaff(p=>({...p,picked:n}))}
                  style={{padding:"10px 14px",borderRadius:"10px",border:"none",
                    background:importStaff.picked===n?"#b07840":"#ede2d0",color:importStaff.picked===n?"#fff":"#5a3a28",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>{n}</button>
              ))}
            </div>
            {importStaff.picked&&(
              <div style={{marginBottom:"10px"}}>
                {importStaff.changedCount>0?(
                  <>
                    <button onClick={()=>confirmImport(importStaff.picked,true)}
                      style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#c0392b",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer",marginBottom:"6px"}}>
                      全部更新（含 {importStaff.changedCount} 筆變動人數）
                    </button>
                    <button onClick={()=>confirmImport(importStaff.picked,false)}
                      style={{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid #c0392b",background:"transparent",color:"#c0392b",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>
                      只匯入，變動讓我逐筆確認
                    </button>
                  </>
                ):(
                  <button onClick={()=>confirmImport(importStaff.picked,false)}
                    style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",background:"#3a7a5a",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
                    確認匯入
                  </button>
                )}
              </div>
            )}
            <button onClick={()=>setImportStaff(null)} style={{width:"100%",padding:"9px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",cursor:"pointer"}}>取消</button>
          </div>
        </div>
      )}
      {mismatchList&&mismatchList.length>0&&(
        <div style={{position:"fixed",inset:0,zIndex:380,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",padding:"20px"}} onClick={()=>setMismatchList(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"18px",width:"100%",maxWidth:"340px",maxHeight:"80vh",overflowY:"auto"}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:"14px",color:"#c02020",fontWeight:"700",marginBottom:"4px",textAlign:"center"}}>⚠ 人數有變動（{mismatchList.length}筆）</div>
            <div style={{fontSize:"11px",color:"#8a6a4a",textAlign:"center",marginBottom:"12px"}}>大麥的人數和追蹤表不一致</div>
            {mismatchList.map((m,idx)=>(
              <div key={idx} style={{background:"#fff",borderRadius:"10px",padding:"10px",marginBottom:"8px",border:"1px solid #e0d5c0"}}>
                <div style={{fontSize:"12px",fontWeight:"700",color:"#3a2a1a"}}>{m.name}　{m.date} {m.time}</div>
                <div style={{fontSize:"12px",color:"#6a4a2e",marginTop:"4px"}}>
                  追蹤表：大{m.oldA}{m.oldC>0?` 童${m.oldC}`:""} → 大麥：<b style={{color:"#c02020"}}>大{m.newA}{m.newC>0?` 童${m.newC}`:""}</b>
                </div>
                <button onClick={()=>{
                  const hc=[m.newA>0?m.newA+"p":"",m.newC>0?m.newC+"c":""].filter(Boolean).join("");
                  setGroups(p=>p.map(x=>x.id!==m.id?x:{...x,headcount:hc}));
                  setMismatchList(prev=>prev.filter((_,i)=>i!==idx));
                }} style={{marginTop:"6px",padding:"6px 12px",borderRadius:"8px",border:"none",background:"#3a7a5a",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>更新為大麥人數</button>
              </div>
            ))}
            <button onClick={()=>setMismatchList(null)} style={{width:"100%",marginTop:"6px",padding:"9px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",cursor:"pointer"}}>關閉（不更新）</button>
          </div>
        </div>
      )}
      {importResult&&(
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:370,background:"#2a6a2a",color:"#fff",padding:"10px 18px",borderRadius:"12px",fontSize:"13px",fontWeight:"700",boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>
          ✓ 已匯入 {importResult.slots} 個時段{importResult.added>0?`，🆕新增 ${importResult.added} 筆大訂`:""}{importResult.updated>0?`，更新 ${importResult.updated} 筆人數`:""}（{importResult.by}）
        </div>
      )}
      {/* 填人數彈窗:大人/小孩 */}
      {editCell&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)"}} onClick={()=>setEditCell(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"18px",width:"250px"}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>填寫人數 {editCell.key}</div>
            <div style={{display:"flex",gap:"10px",marginBottom:"14px"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:"11px",color:"#8a6a50",marginBottom:"4px",textAlign:"center"}}>大人</div>
                <input type="number" autoFocus value={editCell.a}
                  onChange={ev=>setEditCell(p=>({...p,a:ev.target.value}))}
                  style={{width:"100%",padding:"12px 4px",fontSize:"20px",fontWeight:"700",textAlign:"center",border:"1.5px solid #c8b89c",borderRadius:"10px",background:"#fff",color:"#2e2010"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:"11px",color:"#8a6a50",marginBottom:"4px",textAlign:"center"}}>小孩</div>
                <input type="number" value={editCell.ch}
                  onChange={ev=>setEditCell(p=>({...p,ch:ev.target.value}))}
                  style={{width:"100%",padding:"12px 4px",fontSize:"20px",fontWeight:"700",textAlign:"center",border:"1.5px solid #c8b89c",borderRadius:"10px",background:"#fff",color:"#2e2010"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>saveCell(editCell.key,"","")}
                style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",cursor:"pointer"}}>清除</button>
              <button onClick={()=>saveCell(editCell.key,editCell.a,editCell.ch)}
                style={{flex:2,padding:"10px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>確認</button>
            </div>
          </div>
        </div>
      )}

      {/* 完成 key 彈窗:狀態→夥伴 */}
      {finishOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)"}} onClick={()=>{setFinishOpen(false);setFinishStatus(null);}}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"18px",width:"260px"}} onClick={ev=>ev.stopPropagation()}>
            {!finishStatus?(
              <>
                <div style={{fontSize:"13px",color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>本次關訂位關到哪?</div>
                <button onClick={()=>setFinishStatus("complete")}
                  style={{width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:"#3a7a3a",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",marginBottom:"8px"}}>✓ 已關完當月</button>
                <button onClick={()=>setFinishStatus("partial")}
                  style={{width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>關到目前為止</button>
              </>
            ):(
              <>
                <div style={{fontSize:"13px",color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>你是哪位夥伴?</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"7px",justifyContent:"center"}}>
                  {staffOpts.map(n=>(
                    <button key={n} onClick={()=>finishSession(n)}
                      style={{padding:"11px 16px",borderRadius:"10px",border:"none",background:"#ede2d0",color:"#5a3a28",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>{n}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 關訂位選夥伴 */}
      {closePicker&&(closeMap[closePicker]?createPortal(
        <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",padding:"18px"}} onClick={()=>setClosePicker(null)}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"320px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"16px",fontWeight:"800",color:"#2a6a3a",marginBottom:"4px"}}>🔒 這個時段已關訂位</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",marginBottom:"14px",lineHeight:"1.6"}}>
              {closePicker.split("-")[0]} {closePicker.split("-").slice(1).join("-")}<br/>
              關閉夥伴:{typeof closeMap[closePicker]==="object"?`${closeMap[closePicker].by} ${closeMap[closePicker].at||""}`:closeMap[closePicker]}
            </div>
            <button onClick={()=>{ setCloseMap(p=>{ const m={...p}; delete m[closePicker]; persistDW(peopleMap,m,progress); return m; }); setClosePicker(null); }}
              style={{width:"100%",padding:"13px",borderRadius:"11px",border:"none",background:"#c04030",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",marginBottom:"8px"}}>
              ↩ 取消關訂（重新開放訂位）
            </button>
            <div style={{fontSize:"10px",color:"#a08070",marginBottom:"10px"}}>記得也要去大麥POS把訂位打開</div>
            <button onClick={()=>setClosePicker(null)}
              style={{width:"100%",padding:"11px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>關閉視窗</button>
          </div>
        </div>, document.body
      ):(
        <StaffPicker staffList={staffList} onSelect={n=>{setCloseMap(p=>{const now=new Date();const at=`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;const m={...p,[closePicker]:{by:n,at}};persistDW(peopleMap,m,progress);return m;});setClosePicker(null);}} onClose={()=>setClosePicker(null)}/>
      ))}

      {leaveWarn&&createPortal(
        <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",padding:"18px"}} onClick={()=>setLeaveWarn(false)}>
          <div style={{background:"#fff",borderRadius:"18px",padding:"22px",width:"100%",maxWidth:"340px",textAlign:"center",boxShadow:"0 12px 40px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"34px",marginBottom:"6px"}}>⚠️</div>
            <div style={{fontSize:"17px",color:"#c02020",fontWeight:"800",marginBottom:"8px"}}>今天的關訂位還沒完成!</div>
            <div style={{fontSize:"14px",color:"#5a4530",lineHeight:"1.7",marginBottom:"16px"}}>
              今天(週{["日","一","二","三","四","五","六"][_dowNow]})要關訂位。{unclosedRedCnt>0?<>目前還有 <b style={{color:"#c02020"}}>{unclosedRedCnt} 個滿20人的時段</b>沒關。<br/></>:<br/>}要先去大麥POS關掉、並在這裡按「完成關訂位」嗎?
            </div>
            <button onClick={()=>setLeaveWarn(false)}
              style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",background:"#c02020",color:"#fff",fontSize:"15px",fontWeight:"800",cursor:"pointer",marginBottom:"9px"}}>
              留下來處理
            </button>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setLeaveAck(true);setLeaveWarn(false);onBack();}}
                style={{flex:1,padding:"11px",borderRadius:"10px",border:"1px solid #d0b090",background:"#fbf3e6",color:"#8a5a10",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>稍後提醒關閉<div style={{fontSize:"9px",fontWeight:"400",opacity:0.8}}>紅燈保留</div></button>
              <button onClick={()=>{markCloseDone();setLeaveAck(true);setLeaveWarn(false);onBack();}}
                style={{flex:1,padding:"11px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#f0e8d8",color:"#7a6a4a",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>確認不關閉<div style={{fontSize:"9px",fontWeight:"400",opacity:0.8}}>紅燈熄滅</div></button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 表頭 */}
      <div className="np" style={{padding:"6px 12px",background:"#ede2d0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <button onClick={guardedBack} style={{background:"none",border:"none",color:"#6a4a2e",fontSize:"14px",cursor:"pointer",fontWeight:"700"}}>← 返回</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e"}}>✦ 訂位人數統計表 v89</div>
          <div style={{fontSize:"9px",color:"#b05a10",marginTop:"1px"}}>每週一、三、五需統計人數</div>
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          <button onClick={()=>fileInputRef.current&&fileInputRef.current.click()} style={{padding:"6px 10px",borderRadius:"6px",background:"#3a7a5a",border:"none",color:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>📥 大麥</button>
          <button onClick={()=>{setWeekOffset(p=>Math.max(0,p-1));if(isMobile)setViewDay(0);}} style={{padding:"6px 9px",borderRadius:"6px",background:"#e0d2bc",border:"none",color:"#6a4a2e",cursor:"pointer",fontWeight:"700"}}>◀</button>
          <button onClick={()=>{setWeekOffset(0);setViewDay(isMobile?weekDates.indexOf(todayStr):null);}} style={{padding:"5px 8px",borderRadius:"6px",background:"#b07840",border:"none",color:"#fff",cursor:"pointer",fontSize:"10px"}}>本週</button>
          <button onClick={()=>{setWeekOffset(p=>p+1);if(isMobile)setViewDay(0);}} style={{padding:"6px 9px",borderRadius:"6px",background:"#e0d2bc",border:"none",color:"#6a4a2e",cursor:"pointer",fontWeight:"700"}}>▶</button>
        </div>
      </div>

      {/* 一三五 關訂位步驟指引(閃爍提醒夥伴照步驟走) */}
      {showSteps && (
        <div className="np" style={{padding:"7px 10px",background:"#fff4e0",borderBottom:"2px solid #e8a040",flexShrink:0,display:"flex",gap:"6px",alignItems:"stretch",justifyContent:"center"}}>
          {[{n:1,t:"導入訂位"},{n:2,t:"關紅色滿20訂位"},{n:3,t:"按完成關訂位"}].map(s=>{
            const done=s.n<stepCur, cur=s.n===stepCur;
            return (
              <div key={s.n} className={cur?"blinkStep":""} style={{flex:1,maxWidth:"140px",textAlign:"center",padding:"5px 4px",borderRadius:"8px",
                background:done?"#dff0e0":cur?"#ffdf8a":"#f0e6d2",
                border:`2px solid ${done?"#8ac09a":cur?"#e0900a":"#d8c8b0"}`}}>
                <div style={{fontSize:"14px",fontWeight:"900",color:done?"#2a7a4a":cur?"#a05000":"#a08a6a"}}>{done?"✓":s.n}</div>
                <div style={{fontSize:"10px",fontWeight:"700",color:done?"#2a7a4a":cur?"#7a3a00":"#a08a6a",lineHeight:"1.2"}}>{s.t}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 進度橫幅 */}
      {progress&&(
        <div className="np" style={{padding:"5px 12px",background:progress.status==="complete"?"#dff0df":"#fceedc",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,gap:"8px"}}>
          <div style={{fontSize:"11px",color:progress.status==="complete"?"#2a6a2a":"#9a5a10",fontWeight:"700",lineHeight:"1.5"}}>
            {progress.status==="complete"
              ? `✓ 第${progress.round||1}輪：${progress.by} 已關完當月訂位（${progress.at}）`
              : `⏸ 第${progress.round||1}輪：${progress.by} 關訂位關到 ${progress.lastDate}（${progress.at}），尚未完成`}
          </div>
          {progress.status!=="complete"&&(
            <button onClick={jumpToUnkeyed} style={{padding:"7px 10px",borderRadius:"8px",border:"none",background:"#b07840",color:"#fff",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>跳到未關處 →</button>
          )}
        </div>
      )}

      {/* 重複訂位提醒(同電話多筆)— 按✕移除重複,人數自動重算;未接記夥伴 */}
      {dupReservations&&dupReservations.filter(d=>!d.confirmed).length>0&&(
        <div className="np" style={{padding:"5px 12px",background:"#fbe8d8",borderBottom:"1px solid #e0b088",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:dupOpen?"4px":"0",gap:"8px"}}>
            <span style={{fontSize:"12px",color:"#b05a10",fontWeight:"700",flex:1}}>⚠ 重複訂位 {dupReservations.filter(d=>!d.confirmed).length} 組{dupOpen?" — 按 ✕ 移除多訂的,人數自動更新":""}</span>
            <button onClick={()=>setDupOpen(o=>!o)} style={{fontSize:"11px",background:dupOpen?"#c08040":"#e8a040",border:"none",borderRadius:"6px",padding:"5px 10px",color:"#fff",fontWeight:"800",cursor:"pointer",whiteSpace:"nowrap"}}>{dupOpen?"▲ 收合":"▼ 展開處理"}</button>
            <button onClick={()=>{const marked=dupReservations.map(x=>({...x,confirmed:true}));setDupReservations(marked);persistDW(peopleMap,closeMap,progress,marked);}} style={{fontSize:"10px",background:"#e0c0a0",border:"none",borderRadius:"5px",padding:"5px 8px",color:"#7a4a10",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>全部已確認</button>
          </div>
          {dupOpen&&dupReservations.map((d,di)=>d.confirmed?null:(
            <div key={di} style={{marginBottom:"6px",paddingBottom:"5px",borderBottom:"1px dashed #e0c0a0"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                <span style={{fontSize:"12px",color:"#6a4a2e",fontWeight:"700"}}>{d.name}（{d.phone}）</span>
                <button onClick={()=>setMissedPick(di)} style={{fontSize:"10px",background:"#c06030",color:"#fff",border:"none",borderRadius:"5px",padding:"3px 8px",fontWeight:"700",cursor:"pointer"}}>📵 未接{d.missed?` ×${d.missed}`:""}</button>
                <button onClick={()=>{const marked=dupReservations.map((x,idx)=>idx===di?{...x,confirmed:true}:x);setDupReservations(marked);persistDW(peopleMap,closeMap,progress,marked);}} style={{fontSize:"10px",background:"#3a8a5a",color:"#fff",border:"none",borderRadius:"5px",padding:"3px 8px",fontWeight:"700",cursor:"pointer"}}>✓ 確認不是重複</button>
                {d.missed>0&&<span style={{fontSize:"9px",color:"#a05030"}}>{d.missedBy} {d.missedAt}</span>}
                {d.missed>=3&&<span style={{fontSize:"9px",color:"#fff",background:"#c0302a",borderRadius:"4px",padding:"1px 5px",fontWeight:"700"}}>⚠ 聯絡不上</span>}
              </div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                {(d.items||[]).map(it=>(
                  <span key={it.rid} style={{display:"inline-flex",alignItems:"center",gap:"4px",fontSize:"10px",color:"#6a4a2e",background:"#fff",border:"1px solid #e0c8a8",borderRadius:"6px",padding:"2px 4px 2px 7px"}}>
                    {it.date} {it.time}（{it.a}大{it.ch}小）
                    <button onClick={()=>removeDupItem(di,it.rid)} title="移除這筆(人數會扣掉)" style={{background:"#f0d0c0",border:"none",borderRadius:"4px",color:"#a04020",fontWeight:"700",cursor:"pointer",fontSize:"11px",lineHeight:"1",padding:"2px 5px"}}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {missedPick!==null&&<StaffPicker staffList={staffList} onSelect={n=>{markMissed(missedPick,n);setMissedPick(null);}} onClose={()=>setMissedPick(null)}/>}
      {/* 需關訂位警示(滿20未關)— 顯示時段 */}
      {(()=>{
        const weekD = Array.from({length:7},(_,di)=>weekDates[di]).filter(d=>inRange(d));
        const closeList = weekD.map(d=>({d,slots:daySlots(d).needClose})).filter(x=>x.slots.length>0);
        const reopenList = weekD.map(d=>({d,slots:daySlots(d).canReopen})).filter(x=>x.slots.length>0);
        if(closeList.length===0&&reopenList.length===0) return null;
        return (
          <div className="np" style={{flexShrink:0}}>
            <div onClick={()=>setWarnOpen(o=>!o)} style={{padding:"5px 12px",background:closeList.length>0?"#fbe0e0":"#e0f0e0",borderBottom:"1px solid #d0b0b0",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
              <span style={{fontSize:"11px",fontWeight:"800",flex:1,color:closeList.length>0?"#c02020":"#2a7a3a"}}>
                {closeList.length>0&&`⚠ 未關訂位 ${closeList.reduce((s,x)=>s+x.slots.length,0)} 時段`}
                {closeList.length>0&&reopenList.length>0&&"　"}
                {reopenList.length>0&&`↩ 可開放 ${reopenList.reduce((s,x)=>s+x.slots.length,0)} 時段`}
              </span>
              <span style={{fontSize:"11px",fontWeight:"800",color:"#8a5a30",background:"#f0e0d0",borderRadius:"5px",padding:"2px 8px"}}>{warnOpen?"▲ 收合":"▼ 展開"}</span>
            </div>
            {warnOpen&&closeList.length>0&&(
              <div style={{padding:"6px 12px",background:"#fbe0e0",borderBottom:"1px solid #e0a0a0"}}>
                <span style={{fontSize:"12px",color:"#c02020",fontWeight:"700"}}>⚠ 滿{RED_AT}人未關訂位：{closeList.map(x=>`${x.d} ${x.slots.join("/")}`).join("、")} — 請至大麥POS關閉並在此標記</span>
              </div>
            )}
            {warnOpen&&reopenList.length>0&&(()=>{
              const slots=[];
              reopenList.forEach(x=>x.slots.forEach(t=>slots.push({d:x.d,t,key:`${x.d}-${t}`})));
              return (
                <div style={{padding:"6px 12px",background:"#e0f0e0",borderBottom:"1px solid #a0c0a0"}}>
                  <div style={{fontSize:"12px",color:"#2a7a3a",fontWeight:"700",marginBottom:"5px"}}>↩ 人數已減少，可開放訂位（前後時段可能爆客，可按「已確認不開」記錄不重開）：</div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {slots.map(s=>{
                      const ack=noReopen[s.key];
                      return (
                        <span key={s.key} style={{display:"inline-flex",alignItems:"center",gap:"5px",fontSize:"11px",background:ack?"#dfe6df":"#fff",border:`1px solid ${ack?"#b0c0b0":"#88b888"}`,borderRadius:"6px",padding:"3px 5px 3px 8px",color:ack?"#7a8a7a":"#2a6a3a",fontWeight:"700"}}>
                          {s.d} {s.t}
                          <button onClick={(e)=>{e.stopPropagation();toggleNoReopen(s.key);}} style={{fontSize:"10px",border:"none",borderRadius:"4px",padding:"2px 6px",cursor:"pointer",fontWeight:"700",background:ack?"#c0d0c0":"#3a8a5a",color:ack?"#5a6a5a":"#fff",whiteSpace:"nowrap"}}>{ack?"✓ 已確認不開（點取消）":"已確認不開"}</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}
      {/* 顏色說明 */}
      <div className="np" style={{padding:"3px 12px",background:"#f5f0e8",display:"flex",gap:"14px",alignItems:"center",flexShrink:0,fontSize:"10px",color:"#6a4a2e"}}>
        <span><span style={{display:"inline-block",width:"12px",height:"12px",background:"#fff3cc",border:"1px solid #d8c060",borderRadius:"3px",verticalAlign:"-2px"}}/> {YEL_AT}–{RED_AT-1}人 特別留意</span>
        <span><span style={{display:"inline-block",width:"12px",height:"12px",background:"#ffe8e8",border:"1px solid #d88080",borderRadius:"3px",verticalAlign:"-2px"}}/> {RED_AT}人以上</span>
      </div>

      {/* 選單日時的返回全部列(只在篩選單日時出現) */}
      {viewDay!==null&&(
        <div className="np" onClick={()=>setViewDay(null)} style={{padding:"6px 12px",background:"#e8dcc8",flexShrink:0,cursor:"pointer",textAlign:"center",fontSize:"12px",color:"#6a4a2e",fontWeight:"700",borderBottom:"1px solid #d0c0a8"}}>
          目前只看 （{DAYS2[viewDay]}）{weekDates[viewDay]}　—　◀ 點這裡看全部 7 天
        </div>
      )}

      {/* 表格 */}
      <div className="dw" style={{flex:1,overflowY:"auto",overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%",background:"#fff",fontSize:"11px"}}>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:"#ede2d0"}}>
              <th style={{padding:"6px 4px",color:"#6a4a2e",border:"1px solid #c8b89c",minWidth:"46px",position:"sticky",left:0,background:"#ede2d0",zIndex:11,textAlign:"center"}}>時段</th>
              {daysToShow.map(di=>{
                const active=inRange(weekDates[di]);
                const warn=active&&dayNeedsClose(weekDates[di]);
                const sel=viewDay===di;
                return (
                <th key={di} colSpan={3} onClick={()=>active&&setViewDay(viewDay===di?null:di)}
                  style={{padding:"5px 4px",color:sel?"#fff":warn?"#c02020":"#6a4a2e",border:"1px solid #c8b89c",borderLeft:"3px solid #8a6a3a",textAlign:"center",opacity:active?1:0.4,cursor:active?"pointer":"default",background:sel?"#b07840":warn?"#f5d0d0":"transparent"}}>
                  <div style={{fontWeight:"700"}}>（{DAYS2[di]}）{warn?"⚠":""}</div>
                  <div style={{fontSize:"9px",color:sel?"#f5e5d0":"#8a6a4a"}}>{weekDates[di]}</div>
                </th>
                );
              })}
            </tr>
            <tr style={{background:"#e0d2bc"}}>
              <th style={{padding:"4px",border:"1px solid #c8b89c",position:"sticky",left:0,background:"#e0d2bc",zIndex:11}}></th>
              {daysToShow.map(di=>(
                <React.Fragment key={di}>
                  <th style={{padding:"4px 2px",border:"1px solid #c8b89c",borderLeft:"3px solid #8a6a3a",textAlign:"center",fontSize:"10px",color:"#6a4a2e",minWidth:isMobile?"60px":"40px"}}>人數</th>
                  <th style={{padding:"4px 2px",border:"1px solid #c8b89c",textAlign:"center",fontSize:"10px",color:"#6a4a2e",minWidth:isMobile?"70px":"44px"}}>大訂</th>
                  <th style={{padding:"4px 2px",border:"1px solid #c8b89c",textAlign:"center",fontSize:"10px",color:"#6a4a2e",minWidth:isMobile?"50px":"36px"}}>關訂</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES2.map(time=>(
              <tr key={time}>
                <td style={{padding:"6px 3px",border:"1px solid #e0d8c8",textAlign:"center",fontWeight:"700",color:"#a09070",background:"#f0ebe0",fontSize:"11px",whiteSpace:"nowrap",position:"sticky",left:0,zIndex:5}}>{time}</td>
                {daysToShow.map(di=>{
                  const date=weekDates[di];
                  const key=`${date}-${time}`;
                  const sg=getSlotGroups2(date,time);
                  const autoT=sg.reduce((s,g)=>s+parsePpl(g.headcount).total,0);
                  const entry=peopleMap[key];
                  const a=entry?parseInt(entry.a)||0:0;
                  const ch=entry?parseInt(entry.ch)||0:0;
                  const manualTotal=entry?(a+ch):null;
                  const disp=manualTotal!==null?manualTotal:autoT;
                  const red=disp>=RED_AT;
                  const yel=!red&&disp>=YEL_AT;
                  const active=inRange(date);
                  const closer=closeMap[key];
                  return (
                    <React.Fragment key={di}>
                      <td onClick={()=>active&&setEditCell({key,a:entry?String(entry.a):"",ch:entry?String(entry.ch):"",autoT})}
                        style={{padding:"3px",border:"1px solid #e0d8c8",borderLeft:"3px solid #8a6a3a",minWidth:isMobile?"60px":"40px",verticalAlign:"top",cursor:active?"pointer":"default",
                        background:red?"#ffe8e8":yel?"#fff3cc":active?"transparent":"#ece8e0",opacity:active?1:0.45}}>
                        {active&&(entry?(
                          <div style={{textAlign:"center",minHeight:"30px"}}>
                            <div style={{fontSize:"14px",fontWeight:"700",color:red?"#e82020":yel?"#b08000":"#d8c8b0"}}>{manualTotal}</div>
                            <div style={{fontSize:"8px",color:"#8a6a50"}}>大{a} 小{ch}</div>
                            {entry.by&&<div style={{fontSize:"7px",color:"#aaa"}}>{entry.src==="麥"?"麥·":""}{entry.by} {entry.at}</div>}
                          </div>
                        ):(
                          <div style={{textAlign:"center",minHeight:"30px",lineHeight:"30px",fontSize:"13px",fontWeight:"700",color:autoT>=RED_AT?"#e82020":autoT>=YEL_AT?"#b08000":autoT>0?"#9a8a76":"#c8c0b0"}}>{autoT>0?autoT:"＋"}</div>
                        ))}
                      </td>
                      <td style={{padding:"3px",border:"1px solid #e0d8c8",verticalAlign:"top",minWidth:isMobile?"70px":"44px",opacity:active?1:0.45}}>
                        {sg.length>0&&<div style={{textAlign:"center",fontSize:"11px",color:"#5a3a28",fontWeight:"700"}}>{sg.length}</div>}
                        {sg.map(g=>{const p2=parsePpl(g.headcount);return<div key={g.id} style={{fontSize:"9px",color:g.onsiteOrder?"#b07840":"#5a3a28",lineHeight:"1.3",whiteSpace:"nowrap"}}>{g.onsiteOrder?"🍽現點 ":""}{g.name}{p2.adults>0?` 大${p2.adults}`:""}{p2.children>0?` 童${p2.children}`:""}</div>;})}
                      </td>
                      <td style={{padding:"3px",border:"1px solid #e0d8c8",textAlign:"center",minWidth:isMobile?"50px":"36px",opacity:active?1:0.45}}>
                        {active&&<div onClick={()=>setClosePicker(key)}
                          style={{cursor:"pointer",fontSize:"11px",color:closer?"#1a6a1a":"#b0a890",fontWeight:closer?"700":"400",background:closer?"#e0f0e0":"transparent",borderRadius:"4px",padding:"4px 3px",minHeight:"22px"}}>
                          {closer?(typeof closer==="object"?closer.by:closer):"—"}
                          {closer&&typeof closer==="object"&&closer.at&&<div style={{fontSize:"7px",color:"#6a9a6a",fontWeight:"400"}}>{closer.at}</div>}
                        </div>}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 完成 key 浮動按鈕 */}
      <div className="np" style={{padding:"6px 14px",background:"#ede2d0",flexShrink:0}}>
        <button onClick={()=>setFinishOpen(true)}
          style={{width:"100%",padding:"10px",borderRadius:"10px",border:"none",background:"#3a6a8a",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
          🔒 完成關訂位（記錄關到哪＋夥伴）
        </button>
      </div>
    </div>
  );
}

function StatsPage({ onBack, staffList }) {
  const [data, setData] = useState({customers:{}, dishes:{}, daily:{}, hourly:{}, lastImport:null});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const [tab, setTab] = useState("trend");
  const [rangeMode, setRangeMode] = useState("all"); // all|month|custom
  const [fromYmd, setFromYmd] = useState(0);
  const [toYmd, setToYmd] = useState(0);
  const [menuSplit, setMenuSplit] = useState(0); // 菜單分界日 ymd
  const [showMenuSplit, setShowMenuSplit] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const localSaveTime = useRef(0);

  const loadAll = async () => {
    // 讀所有月份文件 + meta,合併成 data
    const months = await FS.loadAllStatsMonths();
    const meta = await FS.loadStatsMeta();
    const merged = {records:[], seenBills:{}, seenOrders:{}, orderSlots:{}, orderDays:{}, dishes:{},
      orderMinY:0, orderMaxY:0, lastImport:(meta&&meta.lastImport)||null, menuSplit:(meta&&meta.menuSplit)||0,
      _months:Object.keys(months).sort()};
    Object.keys(months).forEach(ym=>{
      const mo=months[ym];
      if(mo.records) merged.records.push(...mo.records);
      if(mo.seenBills) Object.assign(merged.seenBills, mo.seenBills);
    });
    // 入單檔時段彙總在 meta
    if(meta){
      merged.orderSlots=meta.orderSlots||{};
      merged.seenOrders=meta.seenOrders||{};
      merged.orderDays=meta.orderDays||{};
      merged.orderMinY=meta.orderMinY||0;
      merged.orderMaxY=meta.orderMaxY||0;
    }
    setData(merged);
    if(meta&&meta.menuSplit) setMenuSplit(meta.menuSplit);
  };
  const clearBilling = async () => {
    if(!window.confirm("確定清除所有「結帳單」資料？\n清除後請重新匯入一份完整範圍的結帳單，日期才會正確。\n此動作無法復原。")) return;
    const months = await FS.loadAllStatsMonths();
    for(const ym of Object.keys(months)){ await FS.saveStatsMonth(ym, {records:[],seenBills:{}}); }
    await FS.saveDoc("stats", {_migrated:true, records:[]});
    await loadAll();
    window.alert("結帳單資料已清除，請重新匯入完整範圍的結帳單。");
  };
  const clearOrders = async () => {
    if(!window.confirm("確定清除所有「入單檔」資料？\n清除後請重新匯入。\n此動作無法復原。")) return;
    const meta = (await FS.loadStatsMeta())||{};
    meta.orderSlots={}; meta.seenOrders={}; meta.orderDays={}; meta.orderMinY=0; meta.orderMaxY=0;
    await FS.saveStatsMeta(meta);
    await loadAll();
    window.alert("入單檔資料已清除，請重新匯入。");
  };
  useEffect(()=>{
    // 先嘗試舊格式(相容),再讀新格式月份
    FS.loadDoc("stats").then(v=>{ if(v&&v.records&&v.records.length>0&&!v._migrated){ setData(v); if(v.menuSplit) setMenuSplit(v.menuSplit); } });
    loadAll();
  },[]);

  const handleFile = async (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    setImporting(true);
    try {
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      // 找「結帳單列表」和「結帳單明細」
      const listSheet = wb.Sheets["結帳單列表"]||wb.Sheets[wb.SheetNames[0]];
      const detailSheet = wb.Sheets["結帳單明細"]||wb.Sheets[wb.SheetNames[1]];
      const list = XLSX.utils.sheet_to_json(listSheet,{header:1});
      const detail = detailSheet?XLSX.utils.sheet_to_json(detailSheet,{header:1}):[];

      // 列表標題
      if(!list.length||!list[0]){ alert("讀取失敗：這個檔案的第一個工作表是空的，請確認上傳的是大麥「結帳單」匯出檔。"); setImporting(false); if(fileRef.current)fileRef.current.value=""; return; }
      const lh=list[0].map(x=>String(x||""));
      const cBill=lh.findIndex(x=>x.includes("結帳單編號"));
      const cPhone=lh.findIndex(x=>x.includes("電話"));
      const cAmt=lh.findIndex(x=>x.includes("總金額"));
      // 結帳單列表本身就帶日期(建立時間/取餐時間)，單一工作表的匯出檔也能抓到日期
      const cTime=lh.findIndex(x=>x.includes("建立時間"));
      const cTime2=lh.findIndex(x=>x.includes("取餐時間"));
      const parseDT=(t)=>{ if(t===null||t===undefined||t==="") return null; if(t instanceof Date) return t; if(typeof t==="number"){ const o=(XLSX.SSF&&XLSX.SSF.parse_date_code)?XLSX.SSF.parse_date_code(t):null; return o?new Date(o.y,o.m-1,o.d,o.H||0,o.M||0):null; } const m=String(t).match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/); return m?new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):null; };
      if(cBill<0){ alert("讀取失敗：找不到「結帳單編號」欄位，請確認上傳的是大麥「結帳單」匯出檔（不是入單檔）。"); setImporting(false); if(fileRef.current)fileRef.current.value=""; return; }
      // 明細標題
      let billDate={}, billDishes={};
      if(detail.length>0){
        const dh=detail[0].map(x=>String(x||""));
        const dBill=dh.findIndex(x=>x.includes("結帳單編號"));
        const dName=dh.findIndex(x=>x.includes("餐點名稱"));
        const dQty=dh.findIndex(x=>x.includes("數量"));
        const dTime=dh.findIndex(x=>x.includes("建立時間"));
        const dAmt=dh.findIndex(x=>x==="金額");
        for(let r=1;r<detail.length;r++){
          const row=detail[r]; if(!row||!row[dBill]) continue;
          const bill=String(row[dBill]);
          const t=row[dTime];
          if(t&&!billDate[bill]){
            let d2; if(t instanceof Date) d2=t; else if(typeof t==="number"){const o=(XLSX.SSF&&XLSX.SSF.parse_date_code)?XLSX.SSF.parse_date_code(t):null; if(o)d2=new Date(o.y,o.m-1,o.d,o.H||0,o.M||0);} else {const m=String(t).match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):/);if(m)d2=new Date(+m[1],+m[2]-1,+m[3],+m[4]);}
            if(d2) billDate[bill]=d2;
          }
          const name=row[dName];
          if(name&&name!=="--"&&!String(name).includes("會員")){
            const q=parseInt(row[dQty])||1;
            const amt=dAmt>=0?parseInt(String(row[dAmt]||"").replace(/\D/g,""))||0:0;
            billDishes[bill]=billDishes[bill]||[];
            billDishes[bill].push({name:String(name),q,amt});
          }
        }
      }

      // 按月分文件儲存(避免單一文件超過 Firestore 1MB 上限)
      // 先載入現有所有月份
      const existMonths = await FS.loadAllStatsMonths();
      const haveBills={};
      Object.values(existMonths).forEach(mo=>{ if(mo.seenBills) Object.assign(haveBills, mo.seenBills); });
      // 新資料按月分組
      const monthBuckets={}; // ym → {records:[], seenBills:{}}
      let newBills=0;
      for(let r=1;r<list.length;r++){
        const row=list[r]; if(!row||!row[cBill]) continue;
        const bill=String(row[cBill]);
        if(haveBills[bill]) continue;
        haveBills[bill]=1; newBills++;
        const phone=cPhone>=0?String(row[cPhone]||"").replace(/\D/g,""):"";
        const amt=cAmt>=0?parseInt(String(row[cAmt]||"").replace(/\D/g,""))||0:0;
        let d2=billDate[bill];
        if(!d2&&cTime>=0) d2=parseDT(row[cTime]);
        if(!d2&&cTime2>=0) d2=parseDT(row[cTime2]);
        const ymd=d2?d2.getFullYear()*10000+(d2.getMonth()+1)*100+d2.getDate():0;
        const ym=d2?`${d2.getFullYear()}_${String(d2.getMonth()+1).padStart(2,"0")}`:"unknown";
        if(!monthBuckets[ym]) monthBuckets[ym]={records:[],seenBills:{}};
        monthBuckets[ym].records.push({
          ymd, phone:(phone&&/^09\d{8}$/.test(phone))?phone:"",
          amt, hour:d2?d2.getHours():null, slot:d2?`${String(d2.getHours()).padStart(2,"0")}:${d2.getMinutes()<30?"00":"30"}`:null,
          dishes:(billDishes[bill]||[]).map(it=>[it.name,it.q,it.amt||0])
        });
        monthBuckets[ym].seenBills[bill]=1;
      }
      // 合併進現有月份文件並儲存
      localSaveTime.current=Date.now();
      for(const ym in monthBuckets){
        const exist=existMonths[ym]||{records:[],seenBills:{}};
        const merged={
          records:[...(exist.records||[]),...monthBuckets[ym].records],
          seenBills:{...(exist.seenBills||{}),...monthBuckets[ym].seenBills}
        };
        await FS.saveStatsMonth(ym, merged);
      }
      // 更新 meta
      const meta=(await FS.loadStatsMeta())||{};
      meta.lastImport=`${new Date().getMonth()+1}/${new Date().getDate()}`;
      await FS.saveStatsMeta(meta);
      await loadAll();
      setResult({newBills, total:Object.keys(haveBills).length});
      setTimeout(()=>setResult(null),4000);
    } catch(err){ alert("讀取失敗："+err.message); }
    setImporting(false);
    if(fileRef.current) fileRef.current.value="";
  };

  const orderFileRef = useRef(null);
  const handleOrderFile = async (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    setImporting(true);
    try {
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const listSheet = wb.Sheets["訂單列表"]||wb.Sheets[wb.SheetNames[0]];
      const list = XLSX.utils.sheet_to_json(listSheet,{header:1});
      if(!list.length||!list[0]){ alert("讀取失敗：這個檔案的第一個工作表是空的，請確認上傳的是大麥「入單檔（訂單列表）」匯出檔。"); setImporting(false); if(orderFileRef.current)orderFileRef.current.value=""; return; }
      const lh=list[0].map(x=>String(x||""));
      const cOrder=lh.findIndex(x=>x.includes("訂單編號"));
      const cOrderTime=lh.findIndex(x=>x.includes("下訂時間"));
      if(cOrder<0){ alert("讀取失敗：找不到「訂單編號」欄位，請確認上傳的是大麥「入單檔（訂單列表）」匯出檔（不是結帳單）。"); setImporting(false); if(orderFileRef.current)orderFileRef.current.value=""; return; }
      const nd=JSON.parse(JSON.stringify(data));
      nd.orderSlots=nd.orderSlots||{};
      nd.seenOrders=nd.seenOrders||{};
      // 舊資料沒有日期範圍/每日清單 → 這次強制重算(即使編號重複也讀日期)
      const needRebuildDate = !nd.orderMinY || !nd.orderDays;
      nd.orderDays=nd.orderDays||{};
      let newOrders=0;
      for(let r=1;r<list.length;r++){
        const row=list[r]; if(!row||!row[cOrder]) continue;
        const oid=String(row[cOrder]);
        const isNew = !nd.seenOrders[oid];
        if(!isNew && !needRebuildDate) continue;
        const t=row[cOrderTime];
        let d2; if(t instanceof Date) d2=t; else if(typeof t==="number"){const o=(XLSX.SSF&&XLSX.SSF.parse_date_code)?XLSX.SSF.parse_date_code(t):null; if(o)d2=new Date(o.y,o.m-1,o.d,o.H||0,o.M||0);} else {const m=String(t).match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);if(m)d2=new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]);}
        if(d2){
          const oy=d2.getFullYear()*10000+(d2.getMonth()+1)*100+d2.getDate();
          nd.orderDays[oy]=1;
          if(!nd.orderMinY||oy<nd.orderMinY) nd.orderMinY=oy;
          if(!nd.orderMaxY||oy>nd.orderMaxY) nd.orderMaxY=oy;
          if(isNew){
            const slot=`${String(d2.getHours()).padStart(2,"0")}:${d2.getMinutes()<30?"00":"30"}`;
            nd.orderSlots[slot]=(nd.orderSlots[slot]||0)+1;
          }
        }
        if(isNew){ nd.seenOrders[oid]=1; newOrders++; }
      }
      localSaveTime.current=Date.now();
      // 入單檔資料(時段/去重/日期)存 meta
      const meta=(await FS.loadStatsMeta())||{};
      meta.orderSlots=nd.orderSlots;
      meta.seenOrders=nd.seenOrders;
      meta.orderMinY=nd.orderMinY;
      meta.orderMaxY=nd.orderMaxY;
      meta.orderDays=nd.orderDays;
      meta.menuSplit=menuSplit;
      await FS.saveStatsMeta(meta);
      await loadAll();
      setResult({newBills:newOrders, total:Object.keys(nd.seenOrders).length, isOrder:true});
      setTimeout(()=>setResult(null),4000);
    } catch(err){ alert("讀取失敗："+err.message); }
    setImporting(false);
    if(orderFileRef.current) orderFileRef.current.value="";
  };

  // 日期區間篩選 records
  const allRecords=data.records||[];
  const ymds=allRecords.map(r=>r.ymd).filter(y=>y>0);
  const minYmd=ymds.length?Math.min(...ymds):0;
  const maxYmd=ymds.length?Math.max(...ymds):0;
  const fmtYmd=(y)=>y?`${Math.floor(y/10000)}/${Math.floor(y/100)%100}/${y%100}`:"";
  // 缺漏日期:涵蓋範圍內哪幾天沒有結帳單資料
  const haveDays={};
  allRecords.forEach(r=>{ if(r.ymd>0) haveDays[r.ymd]=1; });
  const missingDays=[];
  if(minYmd>0&&maxYmd>0&&minYmd!==maxYmd){
    const ymdToD=(y)=>new Date(Math.floor(y/10000),Math.floor(y/100)%100-1,y%100);
    const dToYmd=(d)=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
    let cur=ymdToD(minYmd); const end=ymdToD(maxYmd);
    let guard=0;
    while(cur<=end&&guard<1000){
      const y=dToYmd(cur);
      if(!haveDays[y]) missingDays.push(y);
      cur.setDate(cur.getDate()+1); guard++;
    }
  }
  // 入單檔缺漏日期:涵蓋範圍內哪幾天沒有入單檔資料(與結帳單分開告知)
  const orderHaveDays=data.orderDays||{};
  const orderMissingDays=[];
  // 只有在已建立每日清單後才比對(舊資料需重新匯入一次入單檔才會有)，避免整段誤報
  if(Object.keys(orderHaveDays).length>0&&data.orderMinY>0&&data.orderMaxY>0&&data.orderMinY!==data.orderMaxY){
    const ymdToD=(y)=>new Date(Math.floor(y/10000),Math.floor(y/100)%100-1,y%100);
    const dToYmd=(d)=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
    let cur=ymdToD(data.orderMinY); const end=ymdToD(data.orderMaxY);
    let guard=0;
    while(cur<=end&&guard<1000){
      const y=dToYmd(cur);
      if(!orderHaveDays[y]) orderMissingDays.push(y);
      cur.setDate(cur.getDate()+1); guard++;
    }
  }
  // 把連續缺漏的日期合併成「幾號到幾號」區間
  const mdShort=(y)=>`${Math.floor(y/100)%100}/${y%100}`;
  const toRanges=(arr)=>{
    if(!arr.length) return [];
    const next=(y)=>{const d=new Date(Math.floor(y/10000),Math.floor(y/100)%100-1,y%100);d.setDate(d.getDate()+1);return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();};
    const out=[]; let s=arr[0], p=arr[0];
    for(let i=1;i<arr.length;i++){ if(arr[i]===next(p)){ p=arr[i]; } else { out.push([s,p]); s=arr[i]; p=arr[i]; } }
    out.push([s,p]); return out;
  };
  const rangeStr=([a,b])=>a===b?mdShort(a):`${mdShort(a)} ~ ${mdShort(b)}`;
  // 篩選範圍
  const recs=allRecords.filter(r=>{
    if(rangeMode==="all") return true;
    if(rangeMode==="week"){
      const now=new Date(); const dow=(now.getDay()+6)%7;
      const mon=new Date(now); mon.setDate(now.getDate()-dow); mon.setHours(0,0,0,0);
      const sun=new Date(mon); sun.setDate(mon.getDate()+6);
      const mY=mon.getFullYear()*10000+(mon.getMonth()+1)*100+mon.getDate();
      const sY=sun.getFullYear()*10000+(sun.getMonth()+1)*100+sun.getDate();
      return r.ymd>=mY && r.ymd<=sY;
    }
    if(rangeMode==="month"){
      const now=new Date(); const ty=now.getFullYear()*10000+(now.getMonth()+1)*100;
      return r.ymd>=ty && r.ymd<ty+100;
    }
    if(rangeMode==="custom"){
      const f=fromYmd||0, t=toYmd||99999999;
      return r.ymd>=f && r.ymd<=t;
    }
    return true;
  });
  // 用篩選後 recs 計算
  const custMap={};
  const dishMap={}; const hourMap={}; let revTotal=0; const daySet={};
  recs.forEach(r=>{
    if(r.phone){ if(!custMap[r.phone]) custMap[r.phone]={visits:0,total:0,ymds:[]}; custMap[r.phone].visits++; custMap[r.phone].total+=r.amt; custMap[r.phone].ymds.push(r.ymd); }
    revTotal+=r.amt;
    if(r.ymd>0) daySet[r.ymd]=1;
    if(r.slot) hourMap[r.slot]=(hourMap[r.slot]||0)+1;
    else if(r.hour!==null&&r.hour!==undefined){const s=`${String(r.hour).padStart(2,"0")}:00`;hourMap[s]=(hourMap[s]||0)+1;}
    (r.dishes||[]).forEach(([nm,q])=>{ dishMap[nm]=(dishMap[nm]||0)+q; });
  });
  const customers=custMap;
  const phones=Object.keys(customers);
  const totalCust=phones.length;
  const repeatCust=phones.filter(p=>customers[p].visits>1);
  const newCust=phones.filter(p=>customers[p].visits===1);
  const repeatRate=totalCust>0?Math.round(repeatCust.length/totalCust*100):0;
  const intervals=[];
  repeatCust.forEach(p=>{
    const ds=[...new Set(customers[p].ymds)].sort((a,b)=>a-b).map(y=>new Date(Math.floor(y/10000),Math.floor(y/100)%100-1,y%100));
    for(let i=1;i<ds.length;i++) intervals.push((ds[i]-ds[i-1])/(1000*60*60*24));
  });
  const avgInterval=intervals.length>0?Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length):0;
  const topCust=[...repeatCust].sort((a,b)=>customers[b].visits-customers[a].visits).slice(0,15);
  const topDishes=Object.entries(dishMap).sort((a,b)=>b[1]-a[1]).slice(0,15);
  // 時段:優先用入單檔下訂時間(orderSlots),較準
  const orderSlots=data.orderSlots||{};
  const hasOrderSlots=Object.keys(orderSlots).length>0;
  const hourly=hasOrderSlots?orderSlots:hourMap;
  const maxHour=Math.max(1,...Object.values(hourly));
  const dailyTotal=revTotal;
  const dayCount=Object.keys(daySet).length;
  // 三類日均營業額:週一到四 / 週五 / 假日(週六日+國定假日)
  const catRev={wd:0,fri:0,hol:0}, catDays={wd:{},fri:{},hol:{}};
  Object.keys(daySet).forEach(ymd=>{
    const y=Math.floor(ymd/10000),m=Math.floor(ymd/100)%100,d=ymd%100;
    const dt=new Date(y,m-1,d); const dow=dt.getDay();
    const dayRev=recs.filter(r=>r.ymd==ymd).reduce((s,r)=>s+r.amt,0);
    let cat;
    if(isHoliday(dt)||dow===0||dow===6) cat="hol";
    else if(dow===5) cat="fri";
    else cat="wd";
    catRev[cat]+=dayRev; catDays[cat][ymd]=1;
  });
  const catAvg={
    wd:Object.keys(catDays.wd).length>0?Math.round(catRev.wd/Object.keys(catDays.wd).length):0,
    fri:Object.keys(catDays.fri).length>0?Math.round(catRev.fri/Object.keys(catDays.fri).length):0,
    hol:Object.keys(catDays.hol).length>0?Math.round(catRev.hol/Object.keys(catDays.hol).length):0,
  };
  // 客單價 = 營業額 / 消費筆數
  const avgTicket=recs.length>0?Math.round(revTotal/recs.length):0;
  // 菜單分界:前後客單價比較(用全部 records,不受區間影響)
  let menuCompare=null, seriesCompare=null;
  if(menuSplit>0){
    const before=allRecords.filter(r=>r.ymd>0&&r.ymd<menuSplit);
    const after=allRecords.filter(r=>r.ymd>=menuSplit);
    const avgB=before.length>0?Math.round(before.reduce((s,r)=>s+r.amt,0)/before.length):0;
    const avgA=after.length>0?Math.round(after.reduce((s,r)=>s+r.amt,0)/after.length):0;
    const diff=avgB>0?Math.round((avgA-avgB)/avgB*100):0;
    menuCompare={avgB,avgA,diff,cntB:before.length,cntA:after.length};
    // 系列均價漲幅(用 dishes 的 amt/q 算每份單價)
    const serBefore={}, serAfter={};
    const collectSer=(recsArr,target)=>{
      recsArr.forEach(r=>{(r.dishes||[]).forEach(([nm,q,amt])=>{
        if(!amt||!q) return;
        const ser=getDishSeries(nm); if(!ser) return;
        if(!target[ser]) target[ser]={sum:0,cnt:0};
        target[ser].sum+=amt; target[ser].cnt+=q;
      });});
    };
    collectSer(before,serBefore); collectSer(after,serAfter);
    seriesCompare=[];
    const allSers=[...new Set([...Object.keys(serBefore),...Object.keys(serAfter)])];
    allSers.forEach(s=>{
      const b=serBefore[s], a=serAfter[s];
      const avgB2=b&&b.cnt>0?Math.round(b.sum/b.cnt):0;
      const avgA2=a&&a.cnt>0?Math.round(a.sum/a.cnt):0;
      if(avgB2>0&&avgA2>0){
        seriesCompare.push({series:s,avgB:avgB2,avgA:avgA2,diff:Math.round((avgA2-avgB2)/avgB2*100),amt:avgA2-avgB2});
      }
    });
    seriesCompare.sort((x,y)=>y.diff-x.diff);
  }
  // 年度對比:今年 vs 去年同期(到目前月份為止)
  let yoyCompare=null;
  if(allRecords.length>0){
    const now=new Date(); const curY=now.getFullYear(); const curMD=(now.getMonth()+1)*100+now.getDate();
    const thisY={rev:0,custs:{},cnt:0}, lastY={rev:0,custs:{},cnt:0};
    allRecords.forEach(r=>{
      if(!r.ymd) return;
      const y=Math.floor(r.ymd/10000), md=Math.floor(r.ymd/100)%100*100+r.ymd%100;
      if(md>curMD) return; // 只比到今天同期
      if(y===curY){ thisY.rev+=r.amt; thisY.cnt++; if(r.phone)thisY.custs[r.phone]=1; }
      else if(y===curY-1){ lastY.rev+=r.amt; lastY.cnt++; if(r.phone)lastY.custs[r.phone]=1; }
    });
    if(lastY.cnt>0){
      const tCust=Object.keys(thisY.custs).length, lCust=Object.keys(lastY.custs).length;
      const tTicket=thisY.cnt>0?Math.round(thisY.rev/thisY.cnt):0, lTicket=lastY.cnt>0?Math.round(lastY.rev/lastY.cnt):0;
      yoyCompare={
        thisRev:thisY.rev,lastRev:lastY.rev,revDiff:lastY.rev>0?Math.round((thisY.rev-lastY.rev)/lastY.rev*100):0,
        thisCust:tCust,lastCust:lCust,custDiff:lCust>0?Math.round((tCust-lCust)/lCust*100):0,
        thisTicket:tTicket,lastTicket:lTicket,ticketDiff:lTicket>0?Math.round((tTicket-lTicket)/lTicket*100):0,
        curY,lastY:curY-1
      };
    }
  }
  // 趨勢對照:本週 vs 上週 vs 過去4週同星期平均
  const ymdToDate=(y)=>new Date(Math.floor(y/10000),Math.floor(y/100)%100-1,y%100);
  const dateToYmd=(d)=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  // 以資料最新日為「本週」基準
  const latestYmd=maxYmd;
  let trendRows=null, weekTotals=null;
  if(latestYmd>0){
    const latest=ymdToDate(latestYmd);
    // 找本週週一
    const dow=(latest.getDay()+6)%7; // 0=週一
    const monday=new Date(latest); monday.setDate(latest.getDate()-dow);
    // 按日彙總 records
    const byDay={};
    allRecords.forEach(r=>{ if(r.ymd>0){ if(!byDay[r.ymd]) byDay[r.ymd]={rev:0,cnt:0}; byDay[r.ymd].rev+=r.amt; byDay[r.ymd].cnt++; } });
    const dayName=["一","二","三","四","五","六","日"];
    trendRows=[];
    let twRev=0,twCnt=0,lwRev=0,lwCnt=0;
    for(let i=0;i<7;i++){
      const thisD=new Date(monday); thisD.setDate(monday.getDate()+i);
      const lastD=new Date(monday); lastD.setDate(monday.getDate()+i-7);
      const tY=dateToYmd(thisD), lY=dateToYmd(lastD);
      const tv=byDay[tY]?byDay[tY].rev:0, lv=byDay[lY]?byDay[lY].rev:0;
      const tc=byDay[tY]?byDay[tY].cnt:0, lc=byDay[lY]?byDay[lY].cnt:0;
      // 過去4週同星期平均
      let sum4=0,n4=0;
      for(let w=1;w<=4;w++){ const d=new Date(monday); d.setDate(monday.getDate()+i-7*w); const y=dateToYmd(d); if(byDay[y]){sum4+=byDay[y].rev;n4++;} }
      const avg4=n4>0?Math.round(sum4/n4):0;
      const diffLW=lv>0?Math.round((tv-lv)/lv*100):null;
      const diff4=avg4>0?Math.round((tv-avg4)/avg4*100):null;
      twRev+=tv; twCnt+=tc; lwRev+=lv; lwCnt+=lc;
      trendRows.push({day:dayName[i],ymd:tY,thisRev:tv,lastRev:lv,thisCnt:tc,lastCnt:lc,avg4,diffLW,diff4,hasData:tv>0||lv>0});
    }
    weekTotals={twRev,twCnt,lwRev,lwCnt,
      revDiff:lwRev>0?Math.round((twRev-lwRev)/lwRev*100):null,
      cntDiff:lwCnt>0?Math.round((twCnt-lwCnt)/lwCnt*100):null,
      twTicket:twCnt>0?Math.round(twRev/twCnt):0, lwTicket:lwCnt>0?Math.round(lwRev/lwCnt):0,
      monday:dateToYmd(monday)};
    weekTotals.ticketDiff=weekTotals.lwTicket>0?Math.round((weekTotals.twTicket-weekTotals.lwTicket)/weekTotals.lwTicket*100):null;
  }

  const Stat=({label,value,sub,color})=>(
    <div style={{flex:1,minWidth:"100px",background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0",textAlign:"center"}}>
      <div style={{fontSize:"22px",fontWeight:"900",color:color||"#6a4a2e"}}>{value}</div>
      <div style={{fontSize:"11px",color:"#8a6a4a",marginTop:"2px"}}>{label}</div>
      {sub&&<div style={{fontSize:"9px",color:"#b0a090",marginTop:"1px"}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#f5f0e8",fontFamily:"'Noto Sans TC',sans-serif"}}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleFile}/>
      <input ref={orderFileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleOrderFile}/>
      {importing&&<div style={{position:"fixed",inset:0,zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"}}><div style={{background:"#fff",borderRadius:"14px",padding:"24px 30px",fontSize:"14px",color:"#6a4a2e",fontWeight:"700"}}>分析中…</div></div>}
      {result&&<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:370,background:"#2a6a2a",color:"#fff",padding:"10px 18px",borderRadius:"12px",fontSize:"13px",fontWeight:"700"}}>✓ 新增 {result.newBills} 筆，累積 {result.total} 筆{result.isOrder?"訂單(時段)":"消費"}</div>}
      {showMenuSplit&&(
        <div style={{position:"fixed",inset:0,zIndex:380,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",padding:"20px"}} onClick={()=>setShowMenuSplit(false)}>
          <div style={{background:"#fdfaf4",border:"1px solid #d0c0a8",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"300px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"14px",color:"#6a4a2e",fontWeight:"700",marginBottom:"4px",textAlign:"center"}}>設定換菜單日期</div>
            <div style={{fontSize:"11px",color:"#8a6a4a",textAlign:"center",marginBottom:"14px"}}>系統會比較這天前後的平均客單價</div>
            <input type="date" defaultValue={menuSplit>0?`${Math.floor(menuSplit/10000)}-${String(Math.floor(menuSplit/100)%100).padStart(2,"0")}-${String(menuSplit%100).padStart(2,"0")}`:""}
              onChange={e=>{const v=e.target.value;if(v){const[y,m,d]=v.split("-").map(Number);setMenuSplit(y*10000+m*100+d);}}}
              style={{width:"100%",padding:"10px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"14px",marginBottom:"14px"}}/>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={async ()=>{setMenuSplit(0);const meta=(await FS.loadStatsMeta())||{};meta.menuSplit=0;await FS.saveStatsMeta(meta);setShowMenuSplit(false);}}
                style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>清除</button>
              <button onClick={async ()=>{const meta=(await FS.loadStatsMeta())||{};meta.menuSplit=menuSplit;await FS.saveStatsMeta(meta);setShowMenuSplit(false);}}
                style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>確認</button>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:"10px 14px",background:"#ede2d0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#6a4a2e",fontSize:"14px",cursor:"pointer",fontWeight:"700"}}>← 返回</button>
        <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e"}}>📊 數據統計 v89</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"flex-end"}}>
          <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{padding:"6px 9px",borderRadius:"6px",background:"#3a7a5a",border:"none",color:"#fff",fontSize:"10px",fontWeight:"700",cursor:"pointer"}}>📥 結帳單</button>
          <button onClick={()=>orderFileRef.current&&orderFileRef.current.click()} style={{padding:"6px 9px",borderRadius:"6px",background:"#8a5ab4",border:"none",color:"#fff",fontSize:"10px",fontWeight:"700",cursor:"pointer"}}>📥 入單檔</button>
          <button onClick={clearBilling} style={{padding:"6px 9px",borderRadius:"6px",background:"#fff",border:"1px solid #c08060",color:"#a05030",fontSize:"10px",fontWeight:"700",cursor:"pointer"}}>🗑 清結帳</button>
          <button onClick={clearOrders} style={{padding:"6px 9px",borderRadius:"6px",background:"#fff",border:"1px solid #a080c0",color:"#7050a0",fontSize:"10px",fontWeight:"700",cursor:"pointer"}}>🗑 清入單</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
        {totalCust===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:"#8a6a4a"}}>
            <div style={{fontSize:"40px",marginBottom:"12px"}}>📊</div>
            <div style={{fontSize:"14px",fontWeight:"700",marginBottom:"6px"}}>還沒有資料</div>
            <div style={{fontSize:"12px",lineHeight:"1.6"}}>點右上「📥 匯入結帳單」上傳大麥結帳單<br/>每月匯入一次，系統會累積分析<br/>越多月份資料越準確</div>
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",flexWrap:"wrap",gap:"4px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                <div style={{fontSize:"10px",color:"#3a7a5a",fontWeight:"700"}}>📋 結帳單：{minYmd>0?`${fmtYmd(minYmd)} ~ ${fmtYmd(maxYmd)}`:"未匯入"}</div>
                <div style={{fontSize:"10px",color:"#8a5ab4",fontWeight:"700"}}>📥 入單檔：{data.orderMinY?`${fmtYmd(data.orderMinY)} ~ ${fmtYmd(data.orderMaxY)}`:"未匯入"}</div>
              </div>
            </div>
            {(missingDays.length>0||orderMissingDays.length>0)&&(
              <div style={{background:"#fff4e6",borderRadius:"10px",padding:"10px",border:"1px solid #f0d0a0",marginBottom:"10px"}}>
                <div onClick={()=>setShowMissing(v=>!v)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"6px"}}>
                  <span style={{fontSize:"11px",color:"#c07020",fontWeight:"700"}}>⚠ 有日期沒匯入（結帳單 {missingDays.length} 天、入單檔 {orderMissingDays.length} 天）</span>
                  <span style={{fontSize:"11px",color:"#c07020",whiteSpace:"nowrap"}}>{showMissing?"收合 ▲":"展開 ▼"}</span>
                </div>
                {showMissing&&(
                  <div style={{marginTop:"8px"}}>
                    <div style={{fontSize:"9px",color:"#a08060",marginBottom:"6px"}}>以下日期可能漏匯入，或當天公休沒營業：</div>
                    {missingDays.length>0&&(
                      <div style={{marginBottom:"8px"}}>
                        <div style={{fontSize:"10px",color:"#3a7a5a",fontWeight:"700",marginBottom:"4px"}}>📋 結帳單缺 {missingDays.length} 天</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                          {toRanges(missingDays).map((r,i)=>(
                            <span key={"b"+i} style={{fontSize:"10px",color:"#a05020",background:"#fde8d0",borderRadius:"5px",padding:"2px 8px"}}>{rangeStr(r)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {orderMissingDays.length>0&&(
                      <div>
                        <div style={{fontSize:"10px",color:"#8a5ab4",fontWeight:"700",marginBottom:"4px"}}>📥 入單檔缺 {orderMissingDays.length} 天</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                          {toRanges(orderMissingDays).map((r,i)=>(
                            <span key={"o"+i} style={{fontSize:"10px",color:"#7040a0",background:"#efe2fa",borderRadius:"5px",padding:"2px 8px"}}>{rangeStr(r)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{display:"flex",gap:"6px",marginBottom:"6px"}}>
              {[["all","全部"],["week","本週"],["month","本月"],["custom","自訂區間"]].map(([k,l])=>(
                <button key={k} onClick={()=>setRangeMode(k)} style={{flex:1,padding:"7px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:"700",background:rangeMode===k?"#6a4a2e":"#e0d2bc",color:rangeMode===k?"#fff":"#6a4a2e"}}>{l}</button>
              ))}
            </div>
            {rangeMode==="custom"&&(
              <div style={{display:"flex",gap:"6px",marginBottom:"10px",alignItems:"center"}}>
                <input type="date" onChange={e=>{const v=e.target.value;if(v){const[y,m,d]=v.split("-").map(Number);setFromYmd(y*10000+m*100+d);}}} style={{flex:1,padding:"7px",borderRadius:"8px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"12px"}}/>
                <span style={{fontSize:"12px",color:"#8a6a4a"}}>~</span>
                <input type="date" onChange={e=>{const v=e.target.value;if(v){const[y,m,d]=v.split("-").map(Number);setToYmd(y*10000+m*100+d);}}} style={{flex:1,padding:"7px",borderRadius:"8px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"12px"}}/>
              </div>
            )}
            <div style={{fontSize:"10px",color:"#b0a090",marginBottom:"8px"}}>目前顯示 {recs.length} 筆消費</div>
            {/* 總覽 */}
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px"}}>
              <Stat label="總顧客數" value={totalCust} color="#6a4a2e"/>
              <Stat label="回頭客" value={repeatCust.length} sub={`回訪率 ${repeatRate}%`} color="#3a7a5a"/>
              <Stat label="新客" value={newCust.length} color="#b07840"/>
            </div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px"}}>
              <Stat label="平均回流" value={avgInterval>0?`${avgInterval}天`:"—"} sub="回客平均間隔" color="#8a5ab4"/>
              <Stat label="累積營業額" value={`$${dailyTotal.toLocaleString()}`} sub={`${dayCount}天`} color="#c0392b"/>
              <Stat label="日均營業額" value={dayCount>0?`$${Math.round(dailyTotal/dayCount).toLocaleString()}`:"—"} color="#6a4a2e"/>
              <Stat label="客單價" value={avgTicket>0?`$${avgTicket.toLocaleString()}`:"—"} sub="每筆平均" color="#3a7a5a"/>
            </div>
            {/* 三類日均營業額 */}
            <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0",marginBottom:"14px"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"10px"}}>📅 日均營業額（分類）</div>
              <div style={{display:"flex",gap:"8px",textAlign:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"10px",color:"#8a6a4a"}}>週一至四</div>
                  <div style={{fontSize:"15px",fontWeight:"900",color:"#6a4a2e"}}>{catAvg.wd>0?`$${catAvg.wd.toLocaleString()}`:"—"}</div>
                </div>
                <div style={{flex:1,borderLeft:"1px solid #e0d5c0",borderRight:"1px solid #e0d5c0"}}>
                  <div style={{fontSize:"10px",color:"#8a6a4a"}}>週五</div>
                  <div style={{fontSize:"15px",fontWeight:"900",color:"#b07840"}}>{catAvg.fri>0?`$${catAvg.fri.toLocaleString()}`:"—"}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"10px",color:"#8a6a4a"}}>假日</div>
                  <div style={{fontSize:"15px",fontWeight:"900",color:"#c0392b"}}>{catAvg.hol>0?`$${catAvg.hol.toLocaleString()}`:"—"}</div>
                </div>
              </div>
              <div style={{fontSize:"9px",color:"#b0a090",marginTop:"6px",textAlign:"center"}}>假日含週六日及國定假日</div>
            </div>
            {/* 年度對比 */}
            {yoyCompare&&(
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0",marginBottom:"14px"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"2px"}}>📆 今年 vs 去年同期</div>
                <div style={{fontSize:"9px",color:"#b0a090",marginBottom:"10px"}}>{yoyCompare.lastY} vs {yoyCompare.curY}年（至今日同期）</div>
                {[["營業額",`$${yoyCompare.lastRev.toLocaleString()}`,`$${yoyCompare.thisRev.toLocaleString()}`,yoyCompare.revDiff],
                  ["來客數",yoyCompare.lastCust,yoyCompare.thisCust,yoyCompare.custDiff],
                  ["客單價",`$${yoyCompare.lastTicket.toLocaleString()}`,`$${yoyCompare.thisTicket.toLocaleString()}`,yoyCompare.ticketDiff]].map(([label,last,now,diff])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f5efe3"}}>
                    <div style={{width:"50px",fontSize:"12px",color:"#6a4a2e",fontWeight:"700"}}>{label}</div>
                    <div style={{flex:1,textAlign:"right",fontSize:"12px",color:"#8a6a4a"}}>{last}</div>
                    <div style={{width:"20px",textAlign:"center",color:"#b07840"}}>→</div>
                    <div style={{flex:1,textAlign:"right",fontSize:"12px",color:"#3a2a1a",fontWeight:"700"}}>{now}</div>
                    <div style={{width:"54px",textAlign:"right",fontSize:"12px",fontWeight:"700",color:diff>=0?"#2a8a4a":"#c0392b"}}>{diff>=0?"▲":"▼"}{Math.abs(diff)}%</div>
                  </div>
                ))}
              </div>
            )}
            {/* 菜單分界客單價比較 */}
            <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0",marginBottom:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:menuCompare?"10px":"0"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e"}}>📋 新舊菜單客單價</div>
                <button onClick={()=>setShowMenuSplit(true)} style={{padding:"5px 10px",borderRadius:"7px",border:"none",background:"#ede2d0",color:"#6a4a2e",fontSize:"11px",fontWeight:"700",cursor:"pointer"}}>{menuSplit>0?`換菜單日：${fmtYmd(menuSplit)}`:"設定換菜單日"}</button>
              </div>
              {menuCompare&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",textAlign:"center"}}>
                  <div>
                    <div style={{fontSize:"10px",color:"#8a6a4a"}}>舊菜單</div>
                    <div style={{fontSize:"18px",fontWeight:"900",color:"#8a6a4a"}}>${menuCompare.avgB.toLocaleString()}</div>
                    <div style={{fontSize:"9px",color:"#b0a090"}}>{menuCompare.cntB}筆</div>
                  </div>
                  <div style={{fontSize:"20px",color:"#b07840"}}>→</div>
                  <div>
                    <div style={{fontSize:"10px",color:"#3a7a5a"}}>新菜單</div>
                    <div style={{fontSize:"18px",fontWeight:"900",color:"#3a7a5a"}}>${menuCompare.avgA.toLocaleString()}</div>
                    <div style={{fontSize:"9px",color:"#b0a090"}}>{menuCompare.cntA}筆</div>
                  </div>
                  <div>
                    <div style={{fontSize:"10px",color:"#8a6a4a"}}>變化</div>
                    <div style={{fontSize:"18px",fontWeight:"900",color:menuCompare.diff>=0?"#c0392b":"#3a7a5a"}}>{menuCompare.diff>=0?"+":""}{menuCompare.diff}%</div>
                  </div>
                </div>
              )}
              {seriesCompare&&seriesCompare.length>0&&(
                <div style={{marginTop:"12px",paddingTop:"10px",borderTop:"1px solid #f0e8d6"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"#6a4a2e",marginBottom:"8px"}}>各系列均價漲幅</div>
                  {seriesCompare.map(s=>(
                    <div key={s.series} style={{display:"flex",alignItems:"center",padding:"5px 0",fontSize:"12px"}}>
                      <div style={{flex:1,color:"#4a3520"}}>{s.series}</div>
                      <div style={{color:"#8a6a4a",fontSize:"11px"}}>${s.avgB}→${s.avgA}</div>
                      <div style={{width:"70px",textAlign:"right",fontWeight:"700",color:s.diff>=0?"#c0392b":"#3a7a5a"}}>
                        {s.diff>=0?"+":""}{s.diff}%{s.amt!==0?` ($${s.amt>=0?"+":""}${s.amt})`:""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 分頁 */}
            <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
              {[["trend","趨勢對照"],["repeat","常客排行"],["dishes","熱賣餐點"],["hourly","時段分布"]].map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"700",background:tab===k?"#b07840":"#e0d2bc",color:tab===k?"#fff":"#6a4a2e"}}>{l}</button>
              ))}
            </div>

            {tab==="trend"&&(
              weekTotals?(
              <div>
                {/* 三大指標週對週 */}
                <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
                  <div style={{flex:1,background:"#fff",borderRadius:"10px",padding:"10px",border:"1px solid #e0d5c0",textAlign:"center"}}>
                    <div style={{fontSize:"10px",color:"#8a6a4a"}}>本週營業額</div>
                    <div style={{fontSize:"16px",fontWeight:"900",color:"#6a4a2e"}}>${weekTotals.twRev.toLocaleString()}</div>
                    {weekTotals.revDiff!==null&&<div style={{fontSize:"11px",fontWeight:"700",color:weekTotals.revDiff>=0?"#2a8a4a":"#c0392b"}}>{weekTotals.revDiff>=0?"▲":"▼"} {Math.abs(weekTotals.revDiff)}%</div>}
                  </div>
                  <div style={{flex:1,background:"#fff",borderRadius:"10px",padding:"10px",border:"1px solid #e0d5c0",textAlign:"center"}}>
                    <div style={{fontSize:"10px",color:"#8a6a4a"}}>本週來客</div>
                    <div style={{fontSize:"16px",fontWeight:"900",color:"#6a4a2e"}}>{weekTotals.twCnt}</div>
                    {weekTotals.cntDiff!==null&&<div style={{fontSize:"11px",fontWeight:"700",color:weekTotals.cntDiff>=0?"#2a8a4a":"#c0392b"}}>{weekTotals.cntDiff>=0?"▲":"▼"} {Math.abs(weekTotals.cntDiff)}%</div>}
                  </div>
                  <div style={{flex:1,background:"#fff",borderRadius:"10px",padding:"10px",border:"1px solid #e0d5c0",textAlign:"center"}}>
                    <div style={{fontSize:"10px",color:"#8a6a4a"}}>本週客單價</div>
                    <div style={{fontSize:"16px",fontWeight:"900",color:"#6a4a2e"}}>${weekTotals.twTicket.toLocaleString()}</div>
                    {weekTotals.ticketDiff!==null&&<div style={{fontSize:"11px",fontWeight:"700",color:weekTotals.ticketDiff>=0?"#2a8a4a":"#c0392b"}}>{weekTotals.ticketDiff>=0?"▲":"▼"} {Math.abs(weekTotals.ticketDiff)}%</div>}
                  </div>
                </div>
                <div style={{fontSize:"10px",color:"#b0a090",textAlign:"center",marginBottom:"10px"}}>本週 vs 上週（與上週同期比較）</div>
                {/* 每日對照表 */}
                <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0"}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"10px"}}>📈 每日營業額對照</div>
                  <div style={{display:"flex",fontSize:"10px",color:"#8a6a4a",fontWeight:"700",paddingBottom:"6px",borderBottom:"1px solid #e0d5c0"}}>
                    <div style={{width:"36px"}}>星期</div>
                    <div style={{flex:1,textAlign:"right"}}>本週</div>
                    <div style={{flex:1,textAlign:"right"}}>上週</div>
                    <div style={{width:"54px",textAlign:"right"}}>差異</div>
                  </div>
                  {trendRows.map(r=>(
                    <div key={r.ymd} style={{display:"flex",fontSize:"12px",padding:"7px 0",borderBottom:"1px solid #f5efe3",alignItems:"center",opacity:r.hasData?1:0.4}}>
                      <div style={{width:"36px",color:"#6a4a2e",fontWeight:"700"}}>{r.day}</div>
                      <div style={{flex:1,textAlign:"right",color:"#3a2a1a",fontWeight:"700"}}>{r.thisRev>0?`$${(r.thisRev/10000).toFixed(1)}萬`:"—"}</div>
                      <div style={{flex:1,textAlign:"right",color:"#8a6a4a"}}>{r.lastRev>0?`$${(r.lastRev/10000).toFixed(1)}萬`:"—"}</div>
                      <div style={{width:"54px",textAlign:"right",fontWeight:"700",color:r.diffLW===null?"#b0a090":r.diffLW>=0?"#2a8a4a":"#c0392b"}}>
                        {r.diffLW===null?"—":`${r.diffLW>=0?"+":""}${r.diffLW}%`}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 異常提醒:連續下滑 */}
                {(()=>{
                  const declines=trendRows.filter(r=>r.diffLW!==null&&r.diffLW<0).length;
                  const dataRows=trendRows.filter(r=>r.diffLW!==null).length;
                  if(dataRows>=3&&declines>=dataRows*0.6){
                    return <div style={{marginTop:"12px",background:"#fbe0e0",borderRadius:"10px",padding:"12px",border:"1px solid #e0a0a0"}}>
                      <div style={{fontSize:"12px",color:"#c0392b",fontWeight:"700"}}>⚠ 注意：本週 {dataRows} 天有 {declines} 天較上週衰退</div>
                      <div style={{fontSize:"11px",color:"#a05050",marginTop:"4px",lineHeight:"1.5"}}>建議追查是「來客數」還是「客單價」下滑。對照上方三大指標：來客掉→客人變少（競爭/季節/行銷）；客單價掉→點得少（菜單/套餐吸引力）。</div>
                    </div>;
                  }
                  return null;
                })()}
              </div>
              ):(
                <div style={{textAlign:"center",padding:"30px",color:"#8a6a4a",fontSize:"12px"}}>需要至少兩週的資料才能對照<br/>多匯入幾個月的結帳單後就會顯示</div>
              )
            )}
            {tab==="repeat"&&(
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"10px"}}>🏆 常客排行（來訪次數）</div>
                {topCust.length===0?<div style={{fontSize:"12px",color:"#b0a090",textAlign:"center",padding:"12px"}}>還沒有回頭客資料</div>:
                topCust.map((p,i)=>(
                  <div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<topCust.length-1?"1px solid #f0e8d6":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontSize:"13px",fontWeight:"700",color:i<3?"#c0392b":"#8a6a4a",minWidth:"20px"}}>{i+1}</span>
                      <span style={{fontSize:"13px",color:"#4a3520"}}>{p}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontSize:"14px",fontWeight:"700",color:"#3a7a5a"}}>{customers[p].visits}次</span>
                      <span style={{fontSize:"10px",color:"#b0a090",marginLeft:"6px"}}>${customers[p].total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab==="dishes"&&(
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"10px"}}>🍽 熱賣餐點 TOP15</div>
                {topDishes.map(([name,n],i)=>(
                  <div key={name} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<topDishes.length-1?"1px solid #f0e8d6":"none"}}>
                    <span style={{fontSize:"12px",color:"#4a3520"}}><b style={{color:i<3?"#c0392b":"#8a6a4a",marginRight:"6px"}}>{i+1}</b>{name}</span>
                    <span style={{fontSize:"13px",fontWeight:"700",color:"#b07840",whiteSpace:"nowrap"}}>{n}份</span>
                  </div>
                ))}
              </div>
            )}
            {tab==="hourly"&&(
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",border:"1px solid #e0d5c0"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e",marginBottom:"4px"}}>⏰ 時段分布（每30分鐘）</div>
                <div style={{fontSize:"10px",color:"#b0a090",marginBottom:"10px"}}>{hasOrderSlots?"依入單檔「下訂時間」統計（準確）":"依結帳單時間統計，匯入單檔更準"}</div>
                <div style={{background:"#fff8ec",borderRadius:"8px",padding:"8px 10px",marginBottom:"10px",border:"1px solid #f0e0c0"}}>
                  <div style={{fontSize:"11px",color:"#a07030",fontWeight:"700",marginBottom:"2px"}}>⏱ 出餐時間參考</div>
                  <div style={{fontSize:"10px",color:"#b08040",lineHeight:"1.6"}}>常客 10 分鐘內 ・ 新客 4 人以下 20 分鐘內 ・ 新客 5 人以上 30 分鐘內</div>
                </div>
                {Object.keys(hourly).sort().map(h=>(
                  <div key={h} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                    <span style={{fontSize:"11px",color:"#8a6a4a",minWidth:"42px"}}>{h}</span>
                    <div style={{flex:1,background:"#f0e8d6",borderRadius:"4px",height:"18px",overflow:"hidden"}}>
                      <div style={{width:`${hourly[h]/maxHour*100}%`,height:"100%",background:"#b07840"}}/>
                    </div>
                    <span style={{fontSize:"11px",color:"#6a4a2e",fontWeight:"700",minWidth:"30px",textAlign:"right"}}>{hourly[h]}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RefundSection({ group, S, onSaveSig }) {
  const [showRefund, setShowRefund] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [pinOk, setPinOk] = useState(false);
  const [sigType, setSigType] = useState(null);
  const [sigs, setSigs] = useState({staff:null, customer:null});

  if(!showRefund) return (
    <div style={{padding:"8px 16px 12px",background:"#f5efe2"}}>
      <button onClick={()=>setShowRefund(true)}
        style={{width:"100%",padding:"8px 6px",borderRadius:"10px",background:"#e4ecf4",border:"1px solid #3a5a7a",color:"#2a5a8a",fontSize:"12px",fontWeight:"800",cursor:"pointer"}}>
        💰 退款簽名(需員工密碼)
      </button>
    </div>
  );

  if(!pinOk) return (
    <div style={{padding:"14px 16px",borderTop:"1px solid #e0d5c0",background:"#f5efe2"}}>
      <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"8px"}}>輸入員工密碼</div>
      <input value={pin} onChange={e=>{setPin(e.target.value);setPinErr("");}} type="password" placeholder="員工密碼"
        style={{width:"100%",background:"#ffffff",border:"1px solid #d0c0a8",borderRadius:"10px",padding:"11px 14px",color:"#3a2a1a",fontSize:"14px",fontFamily:"'Noto Sans TC',sans-serif",marginBottom:"8px"}}/>
      {pinErr&&<div style={{fontSize:"11px",color:"#e87a5a",marginBottom:"8px"}}>{pinErr}</div>}
      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={()=>{setShowRefund(false);setPin("");}} style={{flex:1,padding:"10px",borderRadius:"10px",background:"#ffffff",border:"1px solid #d8c8b0",color:"#7a5c3e",fontSize:"12px",cursor:"pointer"}}>取消</button>
        <button onClick={()=>{if(pin==="9015"){setPinOk(true);}else setPinErr("密碼錯誤");}}
          style={{flex:1,padding:"10px",borderRadius:"10px",background:"#b07840",border:"none",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>確認</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:"14px 16px",borderTop:"1px solid #e0d5c0",background:"#f5efe2"}}>
      <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"12px"}}>💰 退款簽名</div>
      <div style={{background:"#fdfaf4",borderRadius:"10px",padding:"10px 12px",marginBottom:"12px",fontSize:"12px",color:"#aa8060",lineHeight:"1.8"}}>
        <div><b style={{color:"#8a5210"}}>姓名：</b>{group.name}</div>
        <div><b style={{color:"#8a5210"}}>訂位：</b>{group.date} {group.time}</div>
        <div><b style={{color:"#8a5210"}}>電話：</b>{group.phone}</div>
        <div><b style={{color:"#8a5210"}}>退還訂金：</b>${group.deposit||"—"}</div>
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <button onClick={()=>setSigType("staff")}
          style={{flex:1,padding:"12px",borderRadius:"12px",border:`1px solid ${sigs.staff?"#7ab87a":"#3a5a7a"}`,
            background:sigs.staff?"#dfeadf":"#e4ecf4",color:sigs.staff?"#2a7a4a":"#2a5a8a",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>
          {sigs.staff?"✓ ":""}員工簽名
        </button>
        <button onClick={()=>setSigType("customer")}
          style={{flex:1,padding:"12px",borderRadius:"12px",border:`1px solid ${sigs.customer?"#7ab87a":"#7a5a3a"}`,
            background:sigs.customer?"#dfeadf":"#ffffff",color:sigs.customer?"#2a7a4a":"#c4924a",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>
          {sigs.customer?"✓ ":""}客人簽名
        </button>
      </div>
      {sigs.staff&&sigs.customer&&(
        <div style={{fontSize:"12px",color:"#2a7a4a",textAlign:"center",padding:"8px",background:"#0d1a0d",borderRadius:"8px",marginBottom:"8px"}}>
          ✓ 雙方均已簽名完成
        </div>
      )}
      <button onClick={()=>{setShowRefund(false);setPin("");setPinOk(false);}}
        style={{width:"100%",padding:"11px",borderRadius:"12px",background:"transparent",border:"1px solid #e0d5c0",color:"#5a3a28",fontSize:"12px",fontWeight:"600",cursor:"pointer",marginTop:"4px"}}>
        關閉
      </button>
      {sigType&&(
        <SignatureModal group={group} sigType={sigType}
          onSave={(dataUrl,type)=>{
            setSigs(p=>({...p,[type]:dataUrl}));
            setSigType(null);
            const now=new Date();
            const t=`${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            if(onSaveSig) onSaveSig(type, dataUrl, t);
          }}
          onClose={()=>setSigType(null)}/>
      )}
    </div>
  );
}


// ─── HUADAN (夥伴劃單) ───────────────────────────────────────────────────────
function HuadanPage({ group, onMark, onClose }) {
  const served = group.served||{};
  // 收集餐點(排除飲料);套餐另立一筆「套餐」項
  const mains=[];   // 主餐本體
  const setItems=[]; // 套餐(先出)
  (group.orders||[]).forEach(o=>{
    (o.lines||[]).forEach((line,li)=>{
      const baseKey=`${o.num}-${li}`;
      if(line.custom){ // 員工自訂餐點(素湯以外的加點)也要能劃單
        mains.push({key:baseKey,num:o.num,guest:o.guestName,name:`🖊 ${line.name}${line.qty>1?` ×${line.qty}`:""}`,setId:null,section:"主餐"});
        return;
      }
      const item=findItem(line.itemId);
      if(!item){
        // 找不到對應品項 → 仍列出(避免主餐憑空消失),放「其他」讓夥伴看得到
        if(line.itemId||line.name) mains.push({key:baseKey,num:o.num,guest:o.guestName,name:`⚠ ${line.name||line.itemId||"未知餐點"}`,setId:null,section:"其他"});
        return;
      }
      if(isDrink(item)) return;
      const cat=getItemCategory(item);
      const setId=line.setMeal?line.setMeal.id:null;
      if(setId){
        // 套餐先出(湯品/麵包/甜點),用 key 加 -set
        const setLabel = setId==="A"?"A套":setId==="B"?"B套":"C套";
        setItems.push({key:baseKey+"-set",num:o.num,guest:o.guestName,setId,setLabel,
          desc:setId==="B"?"甜點":setId==="A"?"湯品+麵包":"湯品"});
      }
      // 主餐本體(B套無主餐,只有甜點;B套不列主餐)
      if(setId!=="B"){
        let section;
        if(isMainDish(item)||(setId&&setId!=="B")) section="主餐"; // 套餐(A/C)主餐一律歸主餐
        else if(["甜點","小品"].includes(cat)) section="餐後";
        else section="前菜";                        // 沙拉/前菜/其他
        const catTag=isMainDish(item)?cat:"";        // 義大利麵/燉飯/披薩/早午餐
        mains.push({key:baseKey,num:o.num,guest:o.guestName,name:item.name,cat:catTag,setId,section});
      }
    });
  });
  const setCount={A:0,B:0,C:0};
  setItems.forEach(r=>{ setCount[r.setId]=(setCount[r.setId]||0)+1; });
  const allRows=[...setItems,...mains];
  const doneCount=allRows.filter(r=>served[r.key]).length;

  // 甜點倒數計時器(兩段獨立:已喊甜點、製作時間)
  const DessertTimer=({label,color})=>{
    const [remain,setRemain]=useState(0); // 剩餘秒數
    const [running,setRunning]=useState(false);
    const [inputMin,setInputMin]=useState("");
    const intervalRef=useRef(null);
    useEffect(()=>{
      if(running&&remain>0){
        intervalRef.current=setInterval(()=>{setRemain(r=>{if(r<=1){setRunning(false);return 0;}return r-1;});},1000);
      }
      return ()=>{ if(intervalRef.current) clearInterval(intervalRef.current); };
    },[running,remain>0]);
    const start=()=>{ const m=parseInt(inputMin); if(!m||m<=0) return; setRemain(m*60); setRunning(true); setInputMin(""); };
    const stop=()=>{ setRunning(false); setRemain(0); };
    const mm=Math.floor(remain/60), ss=remain%60;
    const done=!running&&remain===0;
    return (
      <div style={{flex:1,background:"#fff",borderRadius:"10px",padding:"10px",border:`2px solid ${color}`,textAlign:"center"}}>
        <div style={{fontSize:"11px",color:color,fontWeight:"700",marginBottom:"6px"}}>{label}</div>
        {!running&&remain===0?(
          <div style={{display:"flex",gap:"4px",alignItems:"center",justifyContent:"center"}}>
            <input type="number" value={inputMin} onChange={e=>setInputMin(e.target.value)} placeholder="分鐘"
              style={{width:"56px",padding:"7px 4px",fontSize:"14px",textAlign:"center",border:"1px solid #c8b89c",borderRadius:"8px",background:"#fff",color:"#2e2010"}}/>
            <button onClick={start} style={{padding:"7px 12px",borderRadius:"8px",border:"none",background:color,color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>開始</button>
          </div>
        ):(
          <div onClick={stop} style={{cursor:"pointer"}}>
            <div style={{fontSize:"26px",fontWeight:"900",color:remain>0?color:"#c0392b",letterSpacing:"0.05em"}}>
              {remain>0?`${mm}:${String(ss).padStart(2,"0")}`:"時間到"}
            </div>
            <div style={{fontSize:"9px",color:"#a08060",marginTop:"2px"}}>{remain>0?"點一下停止":"點一下重設"}</div>
          </div>
        )}
      </div>
    );
  };

  // 號碼晶片:未劃在前、已劃沉底
  const NumChips=({items})=>{
    const undone=items.filter(r=>!served[r.key]).sort((a,b)=>a.num-b.num);
    const done=items.filter(r=>served[r.key]).sort((a,b)=>a.num-b.num);
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center"}}>
        {undone.map(r=>(
          <button key={r.key} onClick={()=>onMark(r.key)}
            style={{padding:"11px 16px",borderRadius:"12px",border:"none",cursor:"pointer",fontSize:"15px",fontWeight:"700",background:"#f0e8d6",color:"#5a3a28",minWidth:"54px"}}>
            {r.num}號
          </button>
        ))}
        {done.length>0&&undone.length>0&&<div style={{width:"100%",height:"1px",background:"#e0d5c0",margin:"2px 0"}}/>}
        {done.map(r=>(
          <button key={r.key} onClick={()=>onMark(r.key)}
            style={{padding:"9px 14px",borderRadius:"12px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"700",background:"#dff0df",color:"#5a9a5a",textDecoration:"line-through",minWidth:"50px"}}>
            ✓{r.num}號
          </button>
        ))}
      </div>
    );
  };

  // 套餐區:依 A/C/B 分組
  const SetSection=()=>{
    if(setItems.length===0) return null;
    const order=["A","C","B"];
    const colors={A:"#3a6a8a",C:"#6a8a3a",B:"#8a5a8a"};
    return (
      <div style={{marginBottom:"18px"}}>
        <div style={{fontSize:"15px",fontWeight:"900",color:"#6a4a2e",padding:"6px 2px",borderBottom:"2px solid #d0c0a8",marginBottom:"10px"}}>
          🍲 套餐先出（{setItems.filter(r=>served[r.key]).length}/{setItems.length}）
        </div>
        {order.filter(s=>setItems.some(r=>r.setId===s)).map(s=>{
          const list=setItems.filter(r=>r.setId===s);
          const sample=list[0];
          return (
            <div key={s} style={{marginBottom:"12px",background:"#fff",borderRadius:"12px",padding:"10px 12px",border:"1px solid #e0d5c0"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                <span style={{fontSize:"12px",fontWeight:"700",color:"#fff",background:colors[s],borderRadius:"8px",padding:"3px 12px"}}>{s}套</span>
                <span style={{fontSize:"12px",color:"#8a6a4a"}}>{sample.desc}　×{list.length}（已出 {list.filter(r=>served[r.key]).length}）</span>
              </div>
              <NumChips items={list}/>
            </div>
          );
        })}
      </div>
    );
  };

  // 主餐區:同品項合併,各自列號碼
  const MainSection=({title,items,emoji})=>{
    if(items.length===0) return null;
    const byItem={};
    items.forEach(r=>{ (byItem[r.name]=byItem[r.name]||[]).push(r); });
    return (
      <div style={{marginBottom:"18px"}}>
        <div style={{fontSize:"15px",fontWeight:"900",color:"#6a4a2e",padding:"6px 2px",borderBottom:"2px solid #d0c0a8",marginBottom:"10px"}}>
          {emoji} {title}（{items.filter(r=>served[r.key]).length}/{items.length}）
        </div>
        {Object.entries(byItem).map(([name,list])=>(
          <div key={name} style={{marginBottom:"10px",background:"#fff",borderRadius:"12px",padding:"10px 12px",border:"1px solid #e0d5c0"}}>
            <div style={{fontSize:"14px",fontWeight:"700",color:"#3a2a1a",marginBottom:"8px"}}>
              {list[0].cat?<span style={{fontSize:"11px",color:"#8a6a3a",background:"#f0e6d2",borderRadius:"5px",padding:"1px 6px",marginRight:"6px",fontWeight:"700"}}>{list[0].cat}</span>:null}
              {name} <span style={{fontSize:"12px",color:"#8a6a4a"}}>×{list.length}（已出 {list.filter(r=>served[r.key]).length}）</span>
            </div>
            <NumChips items={list}/>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"#f5f0e8",display:"flex",flexDirection:"column",overflowX:"hidden",fontFamily:"'Noto Sans TC',sans-serif"}}>
      <div style={{padding:"10px 14px",background:"#ede2d0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6a4a2e",fontSize:"14px",cursor:"pointer",fontWeight:"700"}}>← 返回</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:"#6a4a2e"}}>🍽 夥伴劃單</div>
          <div style={{fontSize:"10px",color:"#8a6a4a"}}>{group.name}・{group.date} {group.time}</div>
        </div>
        <div style={{fontSize:"13px",fontWeight:"700",color:doneCount===allRows.length&&allRows.length>0?"#2a6a2a":"#b05a10"}}>{doneCount}/{allRows.length}</div>
      </div>
      <div style={{padding:"8px 14px",background:"#faf4e8",display:"flex",gap:"8px",flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        {["A","B","C"].map(s=>setCount[s]>0&&(
          <span key={s} style={{fontSize:"11px",fontWeight:"700",color:"#fff",background:s==="A"?"#3a6a8a":s==="C"?"#6a8a3a":"#8a5a8a",borderRadius:"8px",padding:"3px 10px"}}>{s}套 ×{setCount[s]}</span>
        ))}
        {doneCount===allRows.length&&allRows.length>0&&<span style={{fontSize:"12px",fontWeight:"700",color:"#2a6a2a"}}>✓ 全部出餐完成！</span>}
      </div>

      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"12px 14px",width:"100%",boxSizing:"border-box"}}>
        <SetSection/>
        <MainSection title="前菜" emoji="🥗" items={mains.filter(r=>r.section==="前菜")}/>
        <MainSection title="主餐" emoji="🍝" items={mains.filter(r=>r.section==="主餐")}/>
        <MainSection title="其他" emoji="📋" items={mains.filter(r=>r.section==="其他")}/>
        {mains.filter(r=>r.section==="餐後").length>0&&(
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"15px",fontWeight:"900",color:"#6a4a2e",padding:"6px 2px",borderBottom:"2px solid #d0c0a8",marginBottom:"10px"}}>🍰 甜點計時</div>
            <div style={{display:"flex",gap:"8px"}}>
              <DessertTimer label="已喊甜點" color="#b07840"/>
              <DessertTimer label="製作時間" color="#8a5ab4"/>
            </div>
          </div>
        )}
        <MainSection title="餐後甜點" emoji="🍰" items={mains.filter(r=>r.section==="餐後")}/>
      </div>
    </div>
  );
}

// ─── GROUP SUMMARY PAGE ───────────────────────────────────────────────────────
function GroupSummaryPage({ group, onBack, onCancelOrder, onAddStaffOrder, onToggleVeggie, fromStaff, onArchiveMenu }) {
  const [huadan, setHuadan] = useState(false);
  const [hdPin, setHdPin] = useState(null); // null=關閉 ""=輸入中
  const [addOpen, setAddOpen] = useState(false);   // 員工新增訂單彈窗
  const [addPin, setAddPin] = useState(null);
  const [addMode, setAddMode] = useState("new");   // new | merge
  const [addNum, setAddNum] = useState("");
  const [addName, setAddName] = useState("");
  const [addLines, setAddLines] = useState([{name:"",price:"",qty:1}]);
  const [staffMode, setStaffMode] = useState(false); // 夥伴模式(可改素湯)
  const [smPin, setSmPin] = useState(null);
  // 餐點封存(員工開啟時) —— 跟大訂追蹤表同一份資料,自動連動
  const [gArchModal,setGArchModal]=useState(false);
  const [gArchTime,setGArchTime]=useState("");
  const [gArchPhoto,setGArchPhoto]=useState(null);
  const [gArchBusy,setGArchBusy]=useState(false);
  const [gArchPick,setGArchPick]=useState(false);
  const [gArchPending,setGArchPending]=useState(null);
  const [gStaffList,setGStaffList]=useState(null);
  useEffect(()=>{ if(fromStaff) FS.loadDoc("staff").then(v=>{ if(Array.isArray(v)&&v.length>0) setGStaffList(v); }); },[fromStaff]);
  const gNowStamp=()=>{ const d=new Date(); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const gPickPhoto=async(e)=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; setGArchBusy(true); try{ setGArchPhoto(await compressImage(f)); }catch(err){ window.alert("照片處理失敗，請再試一次"); } setGArchBusy(false); e.target.value=""; };
  const gConfirmArch=async()=>{ setGArchBusy(true); let photoId=null; if(gArchPhoto){ photoId=`${group.id}_${Date.now()}`; await FS.saveDoc(`arch_${photoId}`,{img:gArchPhoto}); } setGArchPending({time:gArchTime||gNowStamp(),photoId}); setGArchBusy(false); setGArchModal(false); setGArchPhoto(null); setGArchPick(true); };
  const gFinalizeArch=(operator)=>{ if(onArchiveMenu&&gArchPending) onArchiveMenu({...gArchPending,operator}); setGArchPick(false); setGArchPending(null); };
  const isMember = group.memberType !== "none";
  const allOrders = group.orders || [];
  const [confirmCancel, setConfirmCancel] = useState(null); // {num, guestName}
  const grandTotal = allOrders.reduce((s, order) => s + orderTotal(order.lines || [], isMember), 0);
  const allLines = allOrders.flatMap(o => o.lines || []);
  const memberFeeInfo = calcMemberFee(allLines, group.memberType);
  const grandSubtotal = grandTotal + memberFeeInfo.fee;
  const grandTotalWithService = Math.round(grandSubtotal * 1.1);

  return (
    <div style={S.page}>
      {!group.unlockOverride&&(group.locked||isPastDeadline(group.date))&&(
        <div style={{padding:"10px 14px",background:"#fbe0e0",borderBottom:"1px solid #7a3030",textAlign:"center"}}>
          <span style={{fontSize:"13px",color:"#b03030",fontWeight:"700"}}>🔒 此訂單已鎖定（已過點餐時間）</span>
        </div>
      )}
      <style>{GS}</style>
      <div style={{...S.header, paddingBottom:"10px"}}>
        <button onClick={onBack} style={S.backBtn}>← 返回</button>
        <div style={S.logo}>✦ 全組訂單總覽{fromStaff&&<span style={{fontSize:"11px",fontWeight:"800",background:"#b07840",color:"#fff",borderRadius:"6px",padding:"2px 8px",marginLeft:"8px",verticalAlign:"middle"}}>員工版</span>}</div>
        <div style={{fontSize:"11px",color:"#aa8060"}}>{group.name} · {group.date} {group.time}{group.headcount?` · 👥 ${group.headcount}`:""}</div>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"14px"}}>
        {fromStaff&&group.archiveType==="menu"&&(
          <div style={{background:"#f3ecfa",border:"1px solid #6a4a8a",borderRadius:"14px",padding:"12px 14px",marginBottom:"14px"}}>
            <div style={{fontSize:"14px",color:"#6a3a8a",fontWeight:"800",marginBottom:"3px"}}>📦 餐點已封存</div>
            {group.archiveTime&&<div style={{fontSize:"11px",color:"#7a6a8a"}}>🕒 {group.archiveTime}</div>}
            {group.archiveBy&&<div style={{fontSize:"11px",color:"#7a6a8a"}}>👤 {group.archiveBy}</div>}
            {(group.archiveSnaps||[]).length>0&&(group.archiveSnaps[group.archiveSnaps.length-1].photoId)&&(
              <div style={{marginTop:"8px"}}><ArchivePhoto photoId={group.archiveSnaps[group.archiveSnaps.length-1].photoId}/></div>
            )}
          </div>
        )}
        {fromStaff&&(
          <button onClick={()=>{setGArchTime(gNowStamp());setGArchPhoto(null);setGArchModal(true);}}
            style={{width:"100%",padding:"12px",borderRadius:"12px",background:"#efe4f8",border:"1px solid #7a5a9a",color:"#6a3a8a",fontSize:"13px",fontWeight:"700",cursor:"pointer",marginBottom:"14px"}}>
            📦 {group.archiveType==="menu"?"重新封存餐點（再拍一張）":"餐點封存（拍 POS 照片）"}
          </button>
        )}
        {allOrders.length > 0 && (
          <div style={{background:"#fff1e0",border:"2px solid #e87a30",borderRadius:"14px",padding:"16px 18px",marginBottom:"14px",boxShadow:"0 2px 12px rgba(232,122,48,0.3)"}}>
            <div style={{fontSize:"15px",color:"#c05a10",fontWeight:"900",marginBottom:"8px"}}>⚠ 重要注意事項</div>
            <div style={{fontSize:"13px",color:"#7a4a10",lineHeight:"2.0",fontWeight:"500"}}>
              確認後訂單將<span style={{color:"#d04a10",fontWeight:"700"}}>鎖住無法改單</span>，需要更改餐點請提前告知，並在截止日期前修正完畢。
            </div>
            <div style={{fontSize:"13px",color:"#7a4a10",lineHeight:"2.0",fontWeight:"500",marginTop:"6px",paddingTop:"6px",borderTop:"1px solid #e8c8a0"}}>
              因人力吃緊，<span style={{color:"#d04a10",fontWeight:"700"}}>用餐當天不會核單</span>，改單務必主動提早告知。
            </div>
            <div style={{fontSize:"13px",color:"#7a4a10",lineHeight:"2.0",fontWeight:"500",marginTop:"6px",paddingTop:"6px",borderTop:"1px solid #e8c8a0"}}>
              ⏳ 現場加點會依照<span style={{color:"#d04a10",fontWeight:"700"}}>入單順序</span>排單製作，建議想吃的餐點先一次點齊。
            </div>
          </div>
        )}
        {allOrders.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px",color:"#5a3a28"}}>尚無人點餐</div>
        ) : (
          allOrders.map((order, oi) => {
            const orderAmt = orderTotal(order.lines || [], isMember);
            const orderAmtWithService = Math.round(orderAmt * 1.1);
            return (
              <div key={oi} style={{background:"#fdfaf4",borderRadius:"14px",padding:"14px",marginBottom:"10px",border:"1px solid #d8c8b0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"25px",fontWeight:"800",color:"#8a5210"}}>{order.num}號</span>
                    <span style={{fontSize:"21px",color:"#4a3520",fontWeight:"700"}}>{order.guestName}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"14px",color:"#8a5210",fontWeight:"700"}}>${orderAmtWithService}</span>
                    {onCancelOrder&&!group.locked&&(
                      <button onClick={()=>setConfirmCancel({num:order.num,guestName:order.guestName})}
                        style={{padding:"4px 10px",borderRadius:"8px",border:"1px solid #7a3030",background:"none",color:"#e87a5a",fontSize:"11px",cursor:"pointer"}}>
                        取消
                      </button>
                    )}
                  </div>
                </div>
                {(order.lines || []).map((line, li) => {
                  if (line.custom) {
                    return (
                      <div key={li} style={{marginBottom:"6px",paddingBottom:"6px",borderBottom:"1px solid #ffffff"}}>
                        <div style={{fontSize:"12px",color:"#c89a5a",fontWeight:"700"}}>[客製]</div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"15px"}}>
                          <span style={{color:"#5a4530"}}>{line.name}{line.qty>1?` ×${line.qty}`:""}</span>
                          <span style={{color:"#9a7c5a"}}>${(Number(line.price)||0)*(line.qty||1)}</span>
                        </div>
                      </div>
                    );
                  }
                  const item = findItem(line.itemId);
                  if (!item) return null;
                  const cat = getItemCategory(item);
                  const price = linePrice(line, isMember);
                  return (
                    <div key={li} style={{marginBottom:"6px",paddingBottom:"6px",borderBottom:"1px solid #ffffff"}}>
                      <div style={{fontSize:"12px",color:"#2a7a4a",fontWeight:"700"}}>{"["+cat+"]"}</div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"15px"}}>
                        <span style={{color:"#5a4530"}}>{item.name}</span>
                        <span style={{color:"#9a7c5a"}}>${getItemPrice(item,isMember)}</span>
                      </div>
                      {(()=>{
                        const it2=findItem(line.itemId);
                        const parts=[];
                        if(line.dressing) parts.push(`醬料:${line.dressing}`);
                        if(line.ice) parts.push(`冰量:${line.ice}`);
                        if(line.sugar) parts.push(`甜度:${line.sugar}`);
                        if(line.mascot) parts.push(`造型:${line.mascot}`);
                        if(line.toggles&&line.toggles.length) parts.push(line.toggles.join("、"));
                        return parts.length>0?<div style={{fontSize:"12px",color:"#7a9a7a",marginTop:"2px"}}>{parts.join(" · ")}</div>:null;
                      })()}
                      {line.setMeal && (()=>{
                        const sm = SET_MEALS.find(s=>s.id===line.setMeal.id);
                        const drinkPrice = line.setMeal.drink?.price || 0;
                        const extra = Math.max(0, drinkPrice - 80);
                        const dk = line.setMeal.drink;
                        const dkParts = [];
                        if(dk?.ice) dkParts.push(dk.ice);
                        if(dk?.sugar) dkParts.push(dk.sugar);
                        if(dk?.mascot) dkParts.push(dk.mascot);
                        const hasSoup = ["A","C"].includes(line.setMeal.id);
                        const veg = line.setMeal.veggieSoup;
                        return (
                          <div style={{fontSize:"12px",color:"#5a9a5a",marginTop:"2px"}}>
                            {sm?.label}
                            {hasSoup&&veg&&<span style={{color:"#dfeadf",fontWeight:"800",background:"#5fe08a",borderRadius:"4px",padding:"1px 7px",marginLeft:"5px"}}>🌿 素湯</span>}
                            {dk && ` · ${dk.name}`}
                            {dkParts.length>0 && ` · ${dkParts.join(" · ")}`}
                            {dk && ` (+$${sm?.price||0} +$${extra})`}
                            {staffMode&&hasSoup&&(
                              <button onClick={()=>onToggleVeggie&&onToggleVeggie(order.num, li)}
                                style={{marginLeft:"6px",fontSize:"11px",fontWeight:"700",border:"none",borderRadius:"5px",padding:"2px 8px",cursor:"pointer",
                                  background:veg?"#5fe08a":"#dfeadf",color:veg?"#dfeadf":"#1a6a3a"}}>{veg?"✓ 素湯（取消）":"改素湯"}</button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#7a5c3e",marginTop:"4px",borderTop:"1px solid #e0d5c0",paddingTop:"4px"}}>
                  <span>小計</span><span style={{color:"#aa8060"}}>${orderAmt}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",color:"#8a5210",fontWeight:"700",marginTop:"2px"}}>
                  <span>含10%服務費</span><span>${orderAmtWithService}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Confirm cancel dialog */}
      {confirmCancel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#fdfaf4",borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"300px",border:"1px solid #7a3030",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"12px"}}>⚠️</div>
            <div style={{fontSize:"15px",color:"#8a5210",fontWeight:"700",marginBottom:"8px"}}>確認取消訂單？</div>
            <div style={{fontSize:"13px",color:"#aa8060",marginBottom:"20px"}}>
              {confirmCancel.num}號 {confirmCancel.guestName} 的訂單將被取消，此動作無法復原。
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setConfirmCancel(null)}
                style={{flex:1,padding:"12px",borderRadius:"12px",background:"#ffffff",border:"1px solid #c8b89c",color:"#aa8060",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>
                不取消
              </button>
              <button onClick={()=>{onCancelOrder(confirmCancel.num);setConfirmCancel(null);}}
                style={{flex:1,padding:"12px",borderRadius:"12px",background:"#fbdcdc",border:"none",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>
                確認取消
              </button>
            </div>
          </div>
        </div>
      )}
      {huadan&&<HuadanPage group={group} onClose={()=>setHuadan(false)}
        onMark={(lineKey)=>{ if(onCancelOrder) onCancelOrder(-98,{lineKey}); }}/>}
      {hdPin!==null&&(
        <div style={{position:"fixed",inset:0,zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)"}} onClick={()=>setHdPin(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #c8b89c",borderRadius:"16px",padding:"18px",width:"240px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"10px",textAlign:"center"}}>輸入員工密碼</div>
            <input type="password" autoFocus value={hdPin} onChange={e=>setHdPin(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&hdPin==="9015"){setHdPin(null);setHuadan(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"14px",textAlign:"center",marginBottom:"10px"}}/>
            <button onClick={()=>{if(hdPin==="9015"){setHdPin(null);setHuadan(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>確認</button>
          </div>
        </div>
      )}
      <div style={{padding:"10px 16px 0",background:"#f5efe2",display:"grid",gridTemplateColumns:fromStaff?"1fr 1fr":"1fr",gap:"8px"}}>
        {!fromStaff&&(
          <button onClick={()=>setHdPin("")}
            style={{padding:"9px 6px",borderRadius:"10px",background:"#e2f0e2",border:"1px solid #9ac09a",color:"#2a6a3a",fontSize:"13px",fontWeight:"800",cursor:"pointer",lineHeight:"1.3"}}>
            🍽 夥伴劃單<div style={{fontSize:"9px",fontWeight:"400",opacity:0.75}}>需員工密碼</div>
          </button>
        )}
        {fromStaff&&(
          <button onClick={()=>setAddOpen(true)}
            style={{padding:"10px 6px",borderRadius:"10px",background:"#f0e4f4",border:"1px solid #c0a0d0",color:"#6a3a8a",fontSize:"13px",fontWeight:"800",cursor:"pointer",lineHeight:"1.3"}}>
            ➕ 員工新增訂單<div style={{fontSize:"9px",fontWeight:"400",opacity:0.75}}>客製餐點</div>
          </button>
        )}
        {fromStaff&&(
          <button onClick={()=>setStaffMode(v=>!v)}
            style={{padding:"10px 6px",borderRadius:"10px",background:staffMode?"#dfeadf":"#e4ecf4",border:`1px solid ${staffMode?"#7ab87a":"#a8b8c8"}`,color:staffMode?"#1a6a3a":"#2a5a8a",fontSize:"13px",fontWeight:"800",cursor:"pointer",lineHeight:"1.3"}}>
            {staffMode?"🔧 素湯模式:開":"🔧 改素湯"}<div style={{fontSize:"9px",fontWeight:"400",opacity:0.75}}>{staffMode?"點此關閉":"點開後在餐點上按 改素湯"}</div>
          </button>
        )}
      </div>
      {smPin!==null&&(
        <div style={{position:"fixed",inset:0,zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)"}} onClick={()=>setSmPin(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #c8b89c",borderRadius:"16px",padding:"18px",width:"240px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"10px",textAlign:"center"}}>輸入員工密碼</div>
            <input type="password" autoFocus value={smPin} onChange={e=>setSmPin(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&smPin==="9015"){setSmPin(null);setStaffMode(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"14px",textAlign:"center",marginBottom:"10px",boxSizing:"border-box"}}/>
            <button onClick={()=>{if(smPin==="9015"){setSmPin(null);setStaffMode(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#3a7a5a",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>確認</button>
          </div>
        </div>
      )}
      {addPin!==null&&(
        <div style={{position:"fixed",inset:0,zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)"}} onClick={()=>setAddPin(null)}>
          <div style={{background:"#fdfaf4",border:"1px solid #c8b89c",borderRadius:"16px",padding:"18px",width:"240px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"13px",color:"#8a5210",fontWeight:"700",marginBottom:"10px",textAlign:"center"}}>輸入員工密碼</div>
            <input type="password" autoFocus value={addPin} onChange={e=>setAddPin(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&addPin==="9015"){setAddPin(null);setAddOpen(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"14px",textAlign:"center",marginBottom:"10px",boxSizing:"border-box"}}/>
            <button onClick={()=>{if(addPin==="9015"){setAddPin(null);setAddOpen(true);}}}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>確認</button>
          </div>
        </div>
      )}
      {gArchModal&&(
        <div style={{position:"fixed",inset:0,zIndex:355,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",padding:"16px"}} onClick={()=>!gArchBusy&&setGArchModal(false)}>
          <div style={{background:"#f5efe2",borderRadius:"18px",padding:"18px",width:"100%",maxWidth:"340px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"15px",color:"#6a3a8a",fontWeight:"800",textAlign:"center",marginBottom:"4px"}}>📦 封存這筆訂單</div>
            <div style={{fontSize:"11px",color:"#7a5c3e",textAlign:"center",marginBottom:"12px"}}>{group.name}（{group.date} {group.time}）</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",fontWeight:"700",marginBottom:"6px"}}>封存日期時間</div>
            <input value={gArchTime} onChange={e=>setGArchTime(e.target.value)}
              style={{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid #c8b89c",background:"#fff",color:"#2e2010",fontSize:"14px",marginBottom:"4px",boxSizing:"border-box"}}/>
            <div style={{fontSize:"11px",color:"#c06030",marginBottom:"12px",fontWeight:"700"}}>⚠ 請改成「POS 照片上」的時間，不是現在時間</div>
            <div style={{fontSize:"12px",color:"#7a5c3e",fontWeight:"700",marginBottom:"6px"}}>POS 照片（選填）</div>
            {gArchPhoto?(
              <div style={{position:"relative",marginBottom:"12px"}}>
                <img src={gArchPhoto} style={{width:"100%",borderRadius:"8px",border:"1px solid #d0c0a8"}}/>
                <button onClick={()=>setGArchPhoto(null)} style={{position:"absolute",top:"6px",right:"6px",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 8px",fontSize:"12px",cursor:"pointer"}}>移除</button>
              </div>
            ):(
              <label style={{display:"block",textAlign:"center",padding:"14px",borderRadius:"8px",border:"1.5px dashed #c0a880",background:"#faf4e8",color:"#9a6a30",fontSize:"13px",fontWeight:"700",cursor:"pointer",marginBottom:"12px"}}>
                📷 拍照 / 選照片
                <input type="file" accept="image/*" onChange={gPickPhoto} style={{display:"none"}}/>
              </label>
            )}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setGArchModal(false)} disabled={gArchBusy}
                style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",border:"1px solid #ddd0bc",color:"#5a3a28",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>取消</button>
              <button onClick={gConfirmArch} disabled={gArchBusy}
                style={{flex:2,padding:"11px",borderRadius:"10px",background:gArchBusy?"#b0a088":"#8a6a4a",border:"none",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:gArchBusy?"default":"pointer"}}>{gArchBusy?"處理中…":"確認封存 →"}</button>
            </div>
          </div>
        </div>
      )}
      {gArchPick&&<StaffPicker staffList={gStaffList} onSelect={n=>gFinalizeArch(n)} onClose={()=>{setGArchPick(false);setGArchPending(null);}}/>}
      {addOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:360,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",padding:"16px"}} onClick={()=>setAddOpen(false)}>
          <div style={{background:"#fdfaf4",border:"1px solid #c8b89c",borderRadius:"16px",padding:"18px",width:"100%",maxWidth:"340px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"15px",color:"#8a5210",fontWeight:"700",marginBottom:"12px",textAlign:"center"}}>➕ 員工新增客人訂單</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
              <button onClick={()=>setAddMode("new")} style={{flex:1,padding:"9px",borderRadius:"8px",border:`1.5px solid ${addMode==="new"?"#2a7a4a":"#3a2a1a"}`,background:addMode==="new"?"#dff0e6":"transparent",color:addMode==="new"?"#1a6a3a":"#aa8060",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>開新訂單</button>
              <button onClick={()=>setAddMode("merge")} style={{flex:1,padding:"9px",borderRadius:"8px",border:`1.5px solid ${addMode==="merge"?"#2a7a4a":"#3a2a1a"}`,background:addMode==="merge"?"#dff0e6":"transparent",color:addMode==="merge"?"#1a6a3a":"#aa8060",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>加入現有號碼</button>
            </div>
            {addMode==="merge"
              ? <input value={addNum} onChange={e=>setAddNum(e.target.value.replace(/\D/g,""))} placeholder="輸入客人號碼（例：3）" inputMode="numeric" style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"14px",marginBottom:"10px",boxSizing:"border-box"}}/>
              : <input value={addName} onChange={e=>setAddName(e.target.value)} placeholder="客人姓名（可不填）" style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"14px",marginBottom:"10px",boxSizing:"border-box"}}/>}
            <div style={{fontSize:"12px",color:"#aa8060",fontWeight:"700",marginBottom:"6px"}}>餐點（菜單沒有的自己打，例：素湯）</div>
            {addLines.map((ln,i)=>(
              <div key={i} style={{display:"flex",gap:"6px",marginBottom:"6px",alignItems:"center"}}>
                <input value={ln.name} onChange={e=>setAddLines(p=>p.map((x,j)=>j!==i?x:{...x,name:e.target.value}))} placeholder="餐點名稱" style={{flex:2,padding:"8px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"13px",minWidth:0,boxSizing:"border-box"}}/>
                <input value={ln.price} onChange={e=>setAddLines(p=>p.map((x,j)=>j!==i?x:{...x,price:e.target.value.replace(/\D/g,"")}))} placeholder="$" inputMode="numeric" style={{width:"56px",padding:"8px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"13px",boxSizing:"border-box"}}/>
                <input value={ln.qty} onChange={e=>setAddLines(p=>p.map((x,j)=>j!==i?x:{...x,qty:Math.max(1,parseInt(e.target.value)||1)}))} inputMode="numeric" style={{width:"40px",padding:"8px",borderRadius:"8px",border:"1px solid #d0c0a8",background:"#ffffff",color:"#3a2a1a",fontSize:"13px",boxSizing:"border-box"}}/>
                {addLines.length>1&&<button onClick={()=>setAddLines(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#e87a5a",cursor:"pointer",fontSize:"16px"}}>✕</button>}
              </div>
            ))}
            <button onClick={()=>setAddLines(p=>[...p,{name:"",price:"",qty:1}])} style={{fontSize:"12px",background:"none",border:"1px dashed #6a4a2a",borderRadius:"8px",color:"#c89a5a",padding:"6px",width:"100%",cursor:"pointer",marginBottom:"12px"}}>+ 再加一道</button>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setAddOpen(false);setAddLines([{name:"",price:"",qty:1}]);setAddNum("");setAddName("");}} style={{flex:1,padding:"11px",borderRadius:"10px",background:"#ffffff",border:"1px solid #c8b89c",color:"#aa8060",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>取消</button>
              <button onClick={()=>{
                const lines=addLines.filter(l=>l.name.trim()).map(l=>({custom:true,name:l.name.trim(),price:parseInt(l.price)||0,qty:l.qty||1}));
                if(lines.length===0) return;
                if(addMode==="merge"&&!addNum.trim()) return;
                onAddStaffOrder&&onAddStaffOrder({mode:addMode,num:addNum,guestName:addName,lines});
                setAddOpen(false);setAddLines([{name:"",price:"",qty:1}]);setAddNum("");setAddName("");
              }} style={{flex:2,padding:"11px",borderRadius:"10px",background:"#3a7a5a",border:"none",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>儲存</button>
            </div>
          </div>
        </div>
      )}
      {!fromStaff&&<RefundSection group={group} S={S} onSaveSig={(type,dataUrl,time)=>{
        if(onCancelOrder) onCancelOrder(-99, {sigType:type, sig:dataUrl, time});
      }}/>}
      {allOrders.length > 0 && (
        <div style={{padding:"14px 16px 24px",borderTop:"1px solid #e0d5c0",background:"#f5efe2"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",color:"#7a5c3e",marginBottom:"4px"}}>
            <span>全組小計（{allOrders.length}人）</span>
            <span style={{color:"#aa8060"}}>${grandTotal}</span>
          </div>
          {memberFeeInfo.fee>0&&(
            <div style={{fontSize:"13px",color:"#2a7a4a",marginBottom:"4px",fontWeight:"700"}}>
              ★ 入會費 +${memberFeeInfo.fee}｜結帳時若有前菜或酒類，折$100
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"20px",color:"#8a5210",fontWeight:"700",marginTop:"4px"}}>
            <span>全組含10%服務費</span>
            <span>${grandTotalWithService}</span>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── INFO CARD ────────────────────────────────────────────────────────────────
function InfoCard({ title, summary, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{background:"#f5f0e8",borderRadius:"14px",marginBottom:"10px",overflow:"hidden",border:"1px solid #e0d5c0"}}>
      <div onClick={()=>setOpen(p=>!p)}
        style={{padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:"14px",fontWeight:"700",color:"#a09070"}}>{title}</div>
          <div style={{fontSize:"12px",color:"#7a5c3e",marginTop:"2px"}}>{summary}</div>
        </div>
        <div style={{fontSize:"16px",color:"#b07840",fontWeight:"700",marginLeft:"10px",flexShrink:0}}>
          {open?"▲":"▼"}
        </div>
      </div>
      {open&&(
        <div style={{padding:"0 16px 14px",borderTop:"1px solid #e0d5c0"}}>
          <div style={{fontSize:"13px",color:"#5a3a28",lineHeight:"1.8",whiteSpace:"pre-line",marginTop:"10px"}}>
            {detail}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ onEnterCode, onEnterOrder, onStaff }) {
  const [code,setCode]=useState("");
  const [num,setNum]=useState("");
  const [mode,setMode]=useState("new");
  const [err,setErr]=useState("");

  const handleGo=()=>{
    const c=code.trim();
    if(!c){setErr("請輸入代碼");return;}
    if(mode==="edit"){
      const n=parseInt(num.trim());
      if(!n){setErr("請輸入號碼");return;}
      onEnterOrder(c,n,setErr);
    } else if(mode==="summary"){
      onEnterCode(c,setErr,true);
    } else {
      onEnterCode(c,setErr);
    }
  };

  return(
    <div style={S.page}>
      <style>{GS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"11px",color:"#8b5e3c",letterSpacing:"0.25em",marginBottom:"12px"}}>✦  W E L C O M E  ✦</div>
          <div style={{fontSize:"32px",fontFamily:"'Noto Serif TC',serif",fontWeight:"700",color:"#8a5210",letterSpacing:"0.06em",marginBottom:"6px"}}>今鶴 JINHER</div>
          <div style={{fontSize:"12px",color:"#5a3a28",letterSpacing:"0.1em"}}>線上點餐系統</div>
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          {[["new","首次點餐"],["edit","查看／修改訂單"],["summary","全組訂單總覽"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}}
              style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"700",
                background:mode===m?"#b07840":"#fdfaf4",color:mode===m?"#fff":"#7a5c3e"}}>
              {l}
            </button>
          ))}
        </div>
        {/* Info Sections - only show for new order mode */}
        {mode==="new"&&[
          {id:"1", title:"低消", summary:"單點主餐或飲料", detail:"5歲或以上需點單點主餐或飲料，套餐、前菜和甜點都不算低消。"},
          {id:"2", title:"線上點餐用意", summary:"減少等待、提升用餐品質", detail:"是為了讓大組訂位減少等待餐點，如果覺得有困難，無法在截止時間前點完的話，可以更改為現場點餐，視現場狀況等待40-50分鐘。"},
          {id:"3", title:"點餐截止時間", summary:"平日前一天12:00 / 假日週五12:00 / 國定假日前一天12:00", detail:"【平日訂位（週二至週五）】\n前一天中午12:00前完成點餐。\n\n【假日訂位（週六、週日）】\n該週禮拜五中午12:00前完成。\n\n【國定假日訂位】\n不論落在週一至週五哪一天，都需在用餐前一天中午12:00前完成。\n\n【其他說明】\n本店無客服，都是現場服務人員，為專注服務現場客人，無法隨時回訊息，收單後統一回覆。\n禮拜五17:00後至禮拜日無法回覆訊息，請見諒，感謝耐心等候！"},
          {id:"4", title:"座位安排", summary:"依現場狀況安排，不可指定", detail:"座位依照現場狀況安排，不可指定位置。如需指定位置，須額外支付包場費用。"},
        ].map(info=>(
          <InfoCard key={info.id} title={info.title} summary={info.summary} detail={info.detail}/>
        ))}
        <div style={{background:"#fdfaf4",borderRadius:"18px",padding:"20px",border:"1px solid #8a6a3a"}}>
          <div style={{fontSize:"14px",color:"#8a5210",fontWeight:"700",marginBottom:"4px"}}>
            {mode==="new"?"輸入訂位點餐代碼":mode==="summary"?"輸入訂位代碼":"輸入代碼 + 您的號碼"}
          </div>
          <div style={{fontSize:"12px",color:"#8a6a4a",marginBottom:"12px"}}>
            {mode==="new"?"由訂位負責人提供，共3碼數字":mode==="summary"?"查看全組所有人的餐點與總金額":"重新進入查看並修改您的訂單"}
          </div>
          <input value={code} onChange={e=>{setCode(e.target.value);setErr("");}}
            placeholder="代碼（3碼）" maxLength={3}
            style={{...S.input,fontSize:"22px",letterSpacing:"0.2em",textAlign:"center",marginBottom:"10px",background:"#fdf7ea",color:"#2e2010",border:"2px solid #c9a45c",fontWeight:"800"}}/>
          {mode==="edit"&&(
            <input value={num} onChange={e=>{setNum(e.target.value);setErr("");}}
              placeholder="您的號碼（如：1）" type="number"
              style={{...S.input,fontSize:"16px",textAlign:"center",marginBottom:"10px"}}/>
          )}
          {mode==="summary"&&(
            <div style={{fontSize:"12px",color:"#2a7a4a",marginBottom:"10px",padding:"8px 12px",background:"#e2f2e8",borderRadius:"8px",border:"1px solid #7ab88a"}}>
              📋 輸入代碼即可查看全組所有人的點餐
            </div>
          )}
          {err&&<div style={{fontSize:"13px",color:"#c04040",marginBottom:"8px",fontWeight:"600"}}>{err}</div>}
          <button disabled={!code.trim()} onClick={handleGo}
            style={{...S.primaryBtn,opacity:!code.trim()?0.35:1}}>
            {mode==="new"?"進入點餐 →":mode==="summary"?"查看全組訂單 →":"查看訂單 →"}
          </button>
        </div>
      </div>
      <div style={{padding:"0 24px 28px"}}>
        <button onClick={onStaff} style={S.ghostBtn}>員工入口</button>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState("home");
  const [groups,setGroupsState]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [activeGroup,setActiveGroup]=useState(null);
  const [summaryFromStaff,setSummaryFromStaff]=useState(false);
  const [existingOrder,setExistingOrder]=useState(null);
  const [staffPin,setStaffPin]=useState("");
  const [showPin,setShowPin]=useState(false);
  const [pinErr,setPinErr]=useState("");
  const [syncStatus,setSyncStatus]=useState("連線中...");
  const unsubRef = useRef(null);

  // Load initial data + subscribe to real-time updates
  useEffect(()=>{
    FS.loadGroups().then(data=>{
      if(data&&Array.isArray(data)&&data.length>0) setGroupsState(data);
      else setGroupsState(DEMO);
      setLoaded(true);
      setSyncStatus("已連線 🔥");
    }).catch(()=>{
      setGroupsState(DEMO);
      setLoaded(true);
      setSyncStatus("離線模式");
    });

    // Real-time listener
    try {
      unsubRef.current = FS.subscribeGroups((data,pending)=>{
        if(data&&Array.isArray(data)) {
          // 別讓即時同步把「剛在本機按下、還沒存完」的修改蓋掉(例如轉一般)
          if(pending) return;                                   // 自己樂觀寫入的回音,本機已有資料
          if(Date.now()-lastLocalEdit.current < 2500) return;   // 剛改過,先別被伺服器舊資料覆蓋
          setGroupsState(data);
          setSyncStatus("即時同步 ✓");
        }
      });
    } catch(e) {}

    return ()=>{ if(unsubRef.current) unsubRef.current(); };
  },[]);

  // Save to Firestore whenever groups change (debounced)
  const saveTimer = useRef(null);
  const lastLocalEdit = useRef(0);
  const setGroups = (updater) => {
    lastLocalEdit.current = Date.now();   // 標記剛在本機改過,讓即時同步暫時別覆蓋
    setGroupsState(prev=>{
      const next = typeof updater==="function" ? updater(prev) : updater;
      // Debounce saves
      if(saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(()=>{
        FS.saveGroups(next).catch(()=>{});
        try { localStorage.setItem("jinher_groups", JSON.stringify(next)); } catch(e) {}
      }, 500);
      return next;
    });
  };

  const enterCode=(code,setErr,isSummary=false)=>{
    const g=groups.find(x=>x.code===code);
    if(!g){setErr("找不到此代碼，請確認後重試");return;}
    if(g.cancelled){setErr("此訂位已取消");return;}
    if(!isSummary && !g.unlockOverride && (g.locked || isPastDeadline(g.date))){
      setErr("⚠ 已過點餐時間，訂單已鎖定，如需協助請洽現場夥伴");
      return;
    }
    setActiveGroup(g);
    setExistingOrder(null);
    setSummaryFromStaff(false);
    setPage(isSummary?"summary":"order");
  };

  const openStaffSummary=(g)=>{ setActiveGroup(g); setExistingOrder(null); setSummaryFromStaff(true); setPage("summary"); };

  const enterOrder=(code,num,setErr)=>{
    const g=groups.find(x=>x.code===code);
    if(!g){setErr("找不到此代碼");return;}
    if(g.cancelled){setErr("此訂位已取消");return;}
    if(!g.unlockOverride && (g.locked || isPastDeadline(g.date))){setErr("⚠ 已過點餐時間，訂單已鎖定，如需協助請洽現場夥伴");return;}
    const order=g.orders.find(o=>o.num===num);
    if(!order){setErr(`找不到 ${num} 號訂單，請確認號碼`);return;}
    setActiveGroup(g);
    setExistingOrder(order);
    setPage("order");
  };

  const submitOrder=(orderData)=>{
    setGroups(prev=>prev.map(g=>{
      if(g.id!==activeGroup.id) return g;
      const existing=g.orders.find(o=>o.num===orderData.num);
      if(existing) {
        // Update existing order
        return {...g,orders:g.orders.map(o=>o.num===orderData.num?{...o,...orderData}:o)};
      }
      // New order: use max num + 1 to avoid duplicates even after deletions
      const maxNum = g.orders.reduce((max, o) => Math.max(max, o.num || 0), 0);
      const correctNum = maxNum + 1;
      const finalOrder = {...orderData, num: correctNum, orderLocked: false};
      return {...g,orders:[...g.orders,finalOrder]};
    }));
    // Update existingOrder so user can view/edit after submit
    setExistingOrder(orderData);
  };

  if(!loaded) return(
    <div style={{minHeight:"100vh",background:"#f5efe2",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
      <style>{GS}</style>
      <div style={{fontSize:"24px",color:"#8a5210",fontFamily:"'Noto Serif TC',serif"}}>今鶴 JINHER</div>
      <div style={{fontSize:"12px",color:"#5a3a28"}}>連線中...</div>
    </div>
  );

  if(page==="staff") return <StaffPage onBack={()=>setPage("home")} groups={groups} setGroups={setGroups} onOpenSummary={openStaffSummary}/>;
  if(page==="summary"&&activeGroup) {
    const liveGroup = groups.find(g=>g.id===activeGroup.id) || activeGroup;
    return <GroupSummaryPage group={liveGroup} fromStaff={summaryFromStaff} onBack={()=>setPage(summaryFromStaff?"staff":"home")}
      onArchiveMenu={({time,photoId,operator})=>{
        const snap={id:`${Date.now()}`, time, photoId:photoId||null, by:operator};
        setGroups(prev=>prev.map(x=>x.id!==liveGroup.id?x:{...x, archived:false, archiveType:"menu", archiveTime:time, archiveBy:operator, archiveSnaps:[...(x.archiveSnaps||[]), snap]}));
      }}
      onToggleVeggie={(orderNum, lineIdx)=>{
        setGroups(prev=>prev.map(g=>{
          if(g.id!==liveGroup.id) return g;
          const orders=(g.orders||[]).map(o=>{
            if(String(o.num)!==String(orderNum)) return o;
            const lines=(o.lines||[]).map((ln,i)=>{
              if(i!==lineIdx||!ln.setMeal) return ln;
              return {...ln, setMeal:{...ln.setMeal, veggieSoup:!ln.setMeal.veggieSoup}};
            });
            return {...o, lines};
          });
          return {...g, orders};
        }));
      }}
      onAddStaffOrder={(payload)=>{
        setGroups(prev=>prev.map(g=>{
          if(g.id!==liveGroup.id) return g;
          const orders=[...(g.orders||[])];
          if(payload.mode==="merge"){
            const idx=orders.findIndex(o=>String(o.num)===String(payload.num));
            if(idx>=0) orders[idx]={...orders[idx],lines:[...(orders[idx].lines||[]),...payload.lines]};
            else orders.push({num:parseInt(payload.num)||(orders.reduce((m,o)=>Math.max(m,o.num||0),0)+1),guestName:payload.guestName||"員工新增",lines:payload.lines,staffAdded:true});
          } else {
            const maxNum=orders.reduce((m,o)=>Math.max(m,o.num||0),0);
            orders.push({num:maxNum+1,guestName:payload.guestName||"員工新增",lines:payload.lines,staffAdded:true});
          }
          return {...g,orders};
        }));
      }}
      onCancelOrder={(num, sigData)=>{
        if(num===-98&&sigData&&sigData.lineKey) {
          // 劃單標記
          setGroups(prev=>prev.map(g=>{
            if(g.id!==liveGroup.id) return g;
            const served={...(g.served||{})};
            if(served[sigData.lineKey]) delete served[sigData.lineKey];
            else served[sigData.lineKey]={at:sigData.at||"",by:sigData.by||""};
            return {...g,served};
          }));
        } else if(sigData) {
          // Saving signature
          const key = sigData.sigType==="staff"?"refundStaffSig":"refundCustomerSig";
          const timeKey = sigData.sigType==="staff"?"refundStaffSigTime":"refundCustomerSigTime";
          setGroups(prev=>prev.map(g=>{
            if(g.id!==liveGroup.id) return g;
            return {...g,[key]:sigData.sig,[timeKey]:sigData.time,refundSigned:true};
          }));
        } else {
          setGroups(prev=>prev.map(g=>{
            if(g.id!==liveGroup.id) return g;
            return {...g, orders: g.orders.filter(o=>o.num!==num)};
          }));
        }
      }}/>;
  }
  if(page==="order"&&activeGroup) {
    const liveGroup = groups.find(g=>g.id===activeGroup.id) || activeGroup;
    const maxNum = (liveGroup.orders||[]).reduce((max, o) => Math.max(max, o.num || 0), 0);
    const nextNum = existingOrder ? existingOrder.num : maxNum + 1;
    return(
      <OrderFlow group={liveGroup} existingOrder={existingOrder} onSubmit={submitOrder} nextNum={nextNum}
        onUpdateGroup={(patch)=>setGroups(prev=>prev.map(g=>g.id===liveGroup.id?{...g,...patch}:g))}
        onBack={(dest)=>{
          if(dest==="summary"){setSummaryFromStaff(false);setPage("summary");}
          else{setPage("home");setActiveGroup(null);setExistingOrder(null);}
        }}/>
    );
  }

  return(
    <>
      <HomePage onEnterCode={enterCode} onEnterOrder={enterOrder} onStaff={()=>setShowPin(true)}/>
      {/* Sync status indicator */}
      <div style={{position:"fixed",bottom:70,right:12,fontSize:"9px",color:"#a09070",background:"#f5efe2",padding:"3px 8px",borderRadius:"10px",border:"1px solid #fdfaf4"}}>
        {syncStatus}
      </div>
      {showPin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fdfaf4",borderRadius:"16px",padding:"24px",width:"280px",border:"1px solid #d0c0a8"}}>
            <div style={{color:"#6a4a2e",fontWeight:"700",marginBottom:"12px",fontFamily:"'Noto Serif TC',serif"}}>員工驗證</div>
            <input value={staffPin} onChange={e=>{setStaffPin(e.target.value);setPinErr("");}}
              placeholder="輸入員工密碼" type="password" style={{...S.input,background:"#fff",color:"#2e2010",border:"1px solid #c8b89c",marginBottom:"8px"}}/>
            {pinErr&&<div style={{fontSize:"11px",color:"#e87a5a",marginBottom:"8px"}}>{pinErr}</div>}
            <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
              <button onClick={()=>{setShowPin(false);setStaffPin("");setPinErr("");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid #d0c0a8",background:"transparent",color:"#a08060",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>取消</button>
              <button onClick={()=>{if(staffPin==="9015"){setPage("staff");setShowPin(false);setStaffPin("");}else setPinErr("密碼錯誤");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:"#b07840",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>進入</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const GS=`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes blinkExcl{0%,100%{opacity:1}50%{opacity:0.12}}
  @keyframes blinkStep{0%,100%{box-shadow:0 0 0 0 rgba(224,144,10,0.0);transform:scale(1)}50%{box-shadow:0 0 0 4px rgba(224,144,10,0.45);transform:scale(1.05)}}
  .blinkStep{animation:blinkStep 0.9s ease-in-out infinite}
  .blinkExcl{display:inline-flex;align-items:center;justify-content:center;color:#fff;background:#e01010;border-radius:50%;width:18px;height:18px;font-size:13px;font-weight:900;margin-left:5px;animation:blinkExcl 0.8s ease-in-out infinite;box-shadow:0 0 0 2px rgba(224,16,16,0.35);vertical-align:middle}
  body{background:#f5efe2}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#c8b89c;border-radius:2px}
  input::placeholder{color:#5a3a28}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
`;
const TH={padding:"9px 6px",color:"#a09070",fontWeight:"700",borderBottom:"2px solid #8a6a3a",borderRight:"1px solid #d4c4a8",textAlign:"center",fontSize:"14px",whiteSpace:"pre-line",background:"#e8ddd0"};
// Light theme for the customer ordering flow (米白 + 放大)
const LS={
  page:      {minHeight:"100vh",background:"#fbf6ee",fontFamily:"'Noto Sans TC',sans-serif",color:"#4a3826",display:"flex",flexDirection:"column"},
  header:    {padding:"20px 16px 12px",background:"linear-gradient(180deg,#f7efe2,#fbf6ee)",borderBottom:"1px solid #ead9be"},
  logo:      {fontSize:"22px",fontFamily:"'Noto Serif TC',serif",fontWeight:"700",color:"#9c5a1c",letterSpacing:"0.06em",marginBottom:"2px"},
  backBtn:   {background:"none",border:"none",color:"#a06a40",fontSize:"14px",fontWeight:"600",cursor:"pointer",padding:"0 0 6px 0"},
  card:      {background:"#ffffff",border:"1px solid #ead9be",borderRadius:"16px",padding:"16px",margin:"14px 16px 0",boxShadow:"0 1px 3px rgba(120,90,50,0.06)"},
  label:     {display:"block",fontSize:"13px",color:"#8a6e50",fontWeight:"600",letterSpacing:"0.06em",marginBottom:"8px",marginTop:"12px"},
  input:     {width:"100%",background:"#fffdf8",border:"1px solid #d8c2a2",borderRadius:"12px",padding:"13px 16px",color:"#3a2a18",fontSize:"16px",fontFamily:"'Noto Sans TC',sans-serif"},
  primaryBtn:{width:"100%",padding:"15px",borderRadius:"14px",background:"#b07840",border:"none",color:"#fff",fontSize:"16px",fontWeight:"700",cursor:"pointer",letterSpacing:"0.04em"},
  ghostBtn:  {width:"100%",padding:"13px",borderRadius:"14px",background:"transparent",border:"1px solid #e0cdb0",color:"#9a7c58",fontSize:"14px",fontWeight:"600",cursor:"pointer",marginTop:"10px"},
};
const S={
  page:      {minHeight:"100vh",background:"#f5efe2",fontFamily:"'Noto Sans TC',sans-serif",color:"#3a2a1a",display:"flex",flexDirection:"column"},
  header:    {padding:"18px 16px 10px",background:"linear-gradient(180deg,#efe6d4,#f5efe2)",borderBottom:"1px solid #e0d5c0"},
  staffHeader: {padding:"18px 16px 10px",background:"linear-gradient(180deg,#efe6d4,#e8dcc8)",borderBottom:"1px solid #c8b89c"},
  logo:      {fontSize:"18px",fontFamily:"'Noto Serif TC',serif",fontWeight:"700",color:"#8a5210",letterSpacing:"0.06em",marginBottom:"2px"},
  backBtn:   {background:"none",border:"none",color:"#8b5e3c",fontSize:"12px",fontWeight:"600",cursor:"pointer",padding:"0 0 6px 0"},
  card:      {background:"#fdfaf4",border:"1px solid #e0d5c0",borderRadius:"14px",padding:"14px",margin:"12px 16px 0"},
  label:     {display:"block",fontSize:"11px",color:"#7a5c3e",fontWeight:"600",letterSpacing:"0.08em",marginBottom:"6px",marginTop:"12px"},
  input:     {width:"100%",background:"#ffffff",border:"1px solid #8a6a3a",borderRadius:"10px",padding:"11px 14px",color:"#2e2010",fontSize:"14px",fontFamily:"'Noto Sans TC',sans-serif"},
  primaryBtn:{width:"100%",padding:"13px",borderRadius:"12px",background:"#b07840",border:"none",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",letterSpacing:"0.04em"},
  ghostBtn:  {width:"100%",padding:"11px",borderRadius:"12px",background:"transparent",border:"1px solid #e0d5c0",color:"#5a3a28",fontSize:"12px",fontWeight:"600",cursor:"pointer",marginTop:"10px"},
  smallBtn:  {padding:"5px 12px",borderRadius:"8px",border:"1px solid #c8b89c",background:"transparent",color:"#aa8060",fontSize:"11px",fontWeight:"600",cursor:"pointer"},
};
