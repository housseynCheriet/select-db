module.exports = function () {
  let path_mod = require("path");
  const fs = require("fs");
  const {
    parseCsv
  } = require("select-csv");
  let DB_dir_path = path_mod.resolve(process.cwd());
  let chnk = 2000;
  let fsz = 1000000;

  function split(str, p, n) {
    let arr = [],
      i = 0,
      l = p.length;
    i = str.indexOf(p);
    if (n) {
      let s = 0;
      while (i != -1 && s < n) {
        arr.push(str.slice(0, i));
        str = str.slice(i + l);
        i = str.indexOf(p);
        s++
      }
    } else
      while (i != -1) {
        arr.push(str.slice(0, i));
        str = str.slice(i + l);
        i = str.indexOf(p)
      }
    arr.push(str);
    return arr
  }

  function B(a, b) {
    let i = 1,
      f = a[0] & 0b01111111;
    while (i < b) {
      f += a[i] * 128 * 256 ** (i - 1);
      i++
    }
    return f
  }

  function to_3_Bytes(num) {
    return [(num & 0xff0000) >> 16, (num & 0xff00) >> 8, num & 0xff]
  }

  function isDir(path) {
    try {
      var stat = fs.lstatSync(path);
      return stat.isDirectory()
    } catch (e) {
      return !1
    }
  };

  function getCol(colName, clmn, a, b) {
    if (clmn !== "*" && !Array.isArray(clmn)) {
      return {
        error: {error: " Columns must a array .. "}
      }
    }
    let colN = {},
      colval = {};
    if (clmn === "*") {
      for (let c in colName) {
        colN[colName[c][0]] = c;
        colval[c] = colName[c][1]
      }
    } else {
      for (let c of clmn) {
        if (c in colName) {
          colN[colName[c][0]] = c;
          colval[c] = colName[c][1]
        } else {
          return {
            error: {error: ' No column with this name "' + c + '" in the table .. '}
          }
        }
      }
    }
    return {
      [a]: colN,
      [b]: colval
    }
  }

  function colForInsert(pathDB, table, clmn) {
    var {
      error,
      pathTb,
      clmn,
      clmnL
    } = check_insert_params(pathDB, table, clmn);
    if (error) return error;

    var refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
      sp = split(refCol, ",", 1);
    var j=0,colName = JSON.parse(sp[1]),

      ca = {};
    if (clmn === "*") {
      clmnL = Object.keys(colName).length
      for (let c in colName) {

        ca[colName[c][0]]=[j, base(250, colName[c][0])]
        j++;
      }
    } else {
      for (let c of clmn) {
        if (c in colName) {

          ca[colName[c][0]]=[j, base(250, colName[c][0])]
          j++;
        } else {
          return {
            error: {error: ' No column with this name "' + c + '" in the table .. '}
          }
        }
      }
    }
    return {
      pathTb: pathTb,
      ca: ca,
      clmnL: clmnL
    }
  }

  function colForUpd(pathTb, clmn, vals) {
    if (clmn !== "*" && !Array.isArray(clmn)) {
      return {
        error: {error: " Columns must a array .. "}
      }
    }
    if (!Array.isArray(vals)) {
      return {
        error: {error: " Values must a array .. "}
      }
    }
    var refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
      sp = split(refCol, ",", 1);
    var colName = JSON.parse(sp[1]),
      setV = {},
      newC;
    let j = 0
    if (clmn === "*") {
      if (clmn.length != Object.keys(vals).length) {
        return {
          error: {error: " The length of the values in the array is not equal to the length of the columns in the table .. "}
        }
      }
      for (let c in colName) {
        newC = Buffer.from(''+vals[j]);
        setV[colName[c][0]] = [...base(250, colName[c][0]), 254, ...base(250, newC.length), 253, ...newC]
        j++
      }
    } else {
      if (clmn.length != vals.length) {
        return {
          error: {error: " The length of the values in the array is not equal to the length of the columns .. "}
        }
      }
      for (let c of clmn) {
        if (c in colName) {

          newC = Buffer.from(''+vals[j]);
          setV[colName[c][0]] = [...base(250, colName[c][0]), 254, ...base(250, newC.length), 253, ...newC]
          j++
        } else {
          return {
            error: {error: ' No column with this name "' + c + '" in the table .. '}
          }
        }

      }
    }

    return {
      setV: setV
    }
  }

  function getColForUpdIf(colName, clmn) {
    if (clmn !== "*" && !Array.isArray(clmn)) {
      return {
        error: {error: " Columns must a array .. "}
      }
    }
    let colN = {},
      colval = {},
      cn = {};
    if (clmn === "*") {
      for (let c in colName) {
        colN[colName[c][0]] = c;
        colval[c] = colName[c][1];

        cn[c] = [colName[c][0], base(250, colName[c][0])]
      }
    } else {
      for (let c of clmn) {
        if (c in colName) {
          colN[colName[c][0]] = c;
          colval[c] = colName[c][1];

          cn[c] = [colName[c][0], base(250, colName[c][0])]
        } else {
          return {
            error: {error: ' No column with this name "' + c + '" in the table .. '}
          }
        }
      }
    }
    return {
      colN: colN,
      colval: colval,
      cn: cn
    }
  }

  function initialCol(pathTb, col, dflt) {
    var refCol = fs.openSync(pathTb + "/i/refCol.txt", "w");
    var colName = {};
    var ld = dflt.length;
    let col_L = col.length;
    let c, i = 0,
      dflt_;
    for (; i < col_L; i++) {
      c = col[i];
      if (i < ld) {
        dflt_ = ''+dflt[i]
      } else {
        dflt_ = ""
      }
      colName[c] = [i, dflt_]
    }
    fs.writeSync(refCol, i + "," + JSON.stringify(colName));
    fs.closeSync(refCol)
  }

  function refData(pathTb) {
    let ref = fs.readFileSync(pathTb + "/i/ref.txt", "utf8");
    let vlsp = split(ref, "\n");
    return [split(vlsp[0], "|").map(Number), split(vlsp[1], "|").map(Number), split(vlsp[2], "|").map(Number),]
  }

  function base(kb, l) {
    var k = kb,
      arr = [];
    arr.push(l % k);
    l -= l % k;
    while (l >= k) {
      arr.push((l / k) % kb);
      k *= kb;
      l -= l % k
    }
    return arr
  }

  function cond(id, clmn, coClmn, get) {
    return 1
  }

  function upd_idxF(vId_,vId,oi,di,bol) {
    let o;
    let vI_ = vId_ + 1;
    if (1) {
      o = vI_ * oi.s;

      let t_DifO = di.reduce((a, b) => a + b, 0);
      if (t_DifO != 0) {
        let chunkX,
          b=oi.b,
          n = 0,
          m = 1,
          k = 10;
        let difO=0;
        while (1) {
          while (vI_ % k == 0) {
            n += 1;
            m = 10 ** n;
            k *= 10;
            di[n] += di[n - 1];
            di[n - 1] = 0
          }
          difO = di[n];
          chunkX = segment(vI_, oi, oi.s);

          if (chunkX.length && B(chunkX, b) == oi.f) {
            l0 = chunkX[b] * 65536 + chunkX[b + 1] * 256 + chunkX[b + 2] + difO;

            fs.writeSync(oi.idxF, Buffer.from(to_3_Bytes(l0)), 0, 3, o + b);

            vI_ += m;
            if (bol || vI_ < vId) 
              o = vI_ * oi.s;
            else 
              break
          }
          else 
              break
        }
        if (chunkX.length == 0) 
          oi.difOffs = [di.reduce((a, b) => a + b, 0), n]
      }

    }
  }

  function saveU(oi, rUpd) {

    var oUpd, ii, n, vId_, vId, rUpdVid, l0, s = oi.s,
      b = oi.b;
    var di = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pathD = oi._pathD + oi.f + ".txt",
      fDb = fs.openSync(pathD, "w+");
    for (let g in rUpd) {
      vId_ = Number(g);
      rUpdVid = rUpd[vId_];
      oUpd = rUpdVid.o[1];
      fs.writeFileSync(fDb, oi.idFr.slice(0, oUpd));
      fs.writeFileSync(fDb, Buffer.from(rUpdVid.ids));
      oUpd += rUpdVid.lenId;
      di[0] += rUpdVid.newLen - rUpdVid.lenId;
      delete rUpd[vId_];
      break
    }
    for (let g in rUpd) {
      n = 0
      vId = Number(g);
      rUpdVid = rUpd[vId];
      if (vId_ + 1 < vId) {
        fs.writeFileSync(fDb, Buffer.from(oi.idFr.slice(oUpd, rUpdVid.o[1])));
        upd_idxF(vId_,vId,oi,di,0)
      }
      ii = vId;
      while (ii % 10 == 0) {
        n += 1;
        di[n] += di[n - 1];
        di[n - 1] = 0;
        ii = ii / 10
      }
      vId_ = vId;
      oUpd = rUpdVid.o[1] + rUpdVid.lenId;
      fs.writeFileSync(fDb, Buffer.from(rUpdVid.ids));

      if (di[n] != 0) {
        l0 = rUpdVid.o[0] + di[n];
        fs.writeSync(oi.idxF, Buffer.from(to_3_Bytes(l0)), 0, 3, vId * s + b)
      }
      di[0] += rUpdVid.newLen - rUpdVid.lenId
    }
    fs.writeFileSync(fDb, oi.idFr.slice(oUpd));
    fs.close(fDb, function (argument) { });
    upd_idxF(vId_,vId,oi,di,1); 
  }

  function saveD(oi, rUpd) {
    var oUpd, ii, n, vId_, vId, rUpdVid, l0, s = oi.s,
      b = oi.b,
      xf = oi.xf;
    xf[0] = xf[0] | 0b10000000;
    var di = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pathD = oi._pathD + oi.f + ".txt",
      fDb = fs.openSync(pathD, "w+");
    for (let g in rUpd) {
      vId_ = Number(g);
      rUpdVid = rUpd[vId_];
      oUpd = rUpdVid.o[1];
      fs.writeFileSync(fDb, oi.idFr.slice(0, oUpd));
      fs.writeSync(oi.idxF, xf, 0, b, vId_ * s);
      oUpd += rUpdVid.lenId;
      di[0] -= rUpdVid.lenId;
      delete rUpd[vId_];
      break
    }
    for (let g in rUpd) {
      n = 0;
      vId = Number(g);
      rUpdVid = rUpd[vId];
      if (vId_ + 1 < vId) {
        fs.writeFileSync(fDb, Buffer.from(oi.idFr.slice(oUpd, rUpdVid.o[1])));
        upd_idxF(vId_,vId,oi,di,0)
      }
      ii = vId;
      while (ii % 10 == 0) {
        n += 1;
        di[n] += di[n - 1];
        di[n - 1] = 0;
        ii = ii / 10
      }
      vId_ = vId;
      oUpd = rUpdVid.o[1] + rUpdVid.lenId;
      l0 = rUpdVid.o[0] + di[n];
      di[0] -= rUpdVid.lenId;
      fs.writeSync(oi.idxF, Buffer.from([...xf, ...to_3_Bytes(l0)]), 0, s, vId * s)
    }
    fs.writeFileSync(fDb, oi.idFr.slice(oUpd));
    fs.close(fDb, function (argument) { });
    upd_idxF(vId_,vId,oi,di,1);

  }

  function segment(vId, oi, s) {
    if (vId >= oi.vId1 || vId < oi.vId0) {
      if (vId != oi.vId) {
        if (vId >= oi.vId1) {
          oi.vId1 = vId + chnk;
          oi.vId0 = oi.vId - chnk
        } else {
          oi.vId0 = vId - chnk;
          oi.vId1 = oi.vId + chnk
        }
      } else {
        oi.vId1 = vId + chnk;
        oi.vId0 = vId - chnk
      }
      if (oi.vId0 < 0) oi.vId0 = 0;
      let chunkSz = s * (oi.vId1 - oi.vId0);
      oi.chunk = Buffer.alloc(chunkSz);
      let byteChunk1 = fs.readSync(oi.idxF, oi.chunk, 0, chunkSz, oi.vId0 * s);
      if (byteChunk1 < chunkSz) {
        oi.chunk = oi.chunk.slice(0, byteChunk1)
      }
    }
    let a = (vId - oi.vId0) * s;
    return oi.chunk.slice(a, a + s)
  }

  function slc(colval, colN, c, offs, lN) {
    let m , x, n, i = offs+c[offs];
    while(c[i]!=255){
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m
      if (x in colN) {
        colval[colN[x]] = c.toString("utf-8", i-m, i)
        lN--;
        if (lN == 0)
          break
      }

    }

    return colval
  }

  function srch(id_, oi, colN, colval_, colCN, colCV_, lNC, chekCond) {
    let c = oi.idFr,
    colval = {
      ...colval_,
    },
      colCV = {
        ...colCV_,
      };

    let m , x, n, i = oi[0][3]+c[oi[0][3]];
    while(c[i]!=255){
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m
      if (x in colN) {
        lNC--;
        if (x in colCN) {
          colCV[colCN[x]] = colval[colN[x]] = c.toString("utf-8", i-m, i);
          lNC--
        } else colval[colN[x]] = c.toString("utf-8", i-m, i)
        if (lNC == 0) {
          break
        }
      } else if (x in colCN) {
        colCV[colCN[x]] = c.toString("utf-8", i-m, i)
        lNC--;
        if (lNC == 0) {
          break
        }
      }
    }
    var _get = {};
    return chekCond(id_, colval, colCV, _get) ? {
      id: id_,
      ...colval,
      get: _get,
    } : !1
  }

  function upd(oi, rUpd, setV_, ls) {
    let s,r,
    c = oi.idFr,
    setV = {
        ...setV_
      };

    let m , x, n, offs = oi[0][3], i = offs+c[offs];

    while(c[i]!=255){
      s = i ;
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m

      if (x in setV) {

        ls--;
        if (ls == 0) {
          s=i
          i=offs+1
          m = n = 0;
          while(n<c[offs]-1){
              m += c[i] * (250 ** n)
              n++;
              i++;
          }
          i+=m
          r = c.slice(s, i)
          break
        }
      } else 

          setV[x] = c.slice(s, i)

    }

    let lenId,ids = []
    for (c in setV) {
        ids.push(...setV[c])

    }

    if (r) {
      lenId = i-offs
      ids.push(...r)

    }
    else{
      lenId = i+1-offs
      ids.push(255)
    }

    let d_l = base(250, ids.length)
    ids.unshift(d_l.length+1,...d_l);

    rUpd[oi.vId] = {
      o: [oi[0][2], oi[0][3]],
      ids: ids,
      newLen: ids.length,
      lenId: lenId,
    }
  }

  function updIf(id_, oi, rUpd, colN, colval_, colCN, colSV_, cn, lNC, chekCond) {
    let s,r,c2, c = oi.idFr,
      setV = {},
      colval = {
        ...colval_,
      },
      colCV = {
        ...colSV_,
      };

    let m , x, n, offs = oi[0][3], i = offs+c[offs];

    while(c[i]!=255){
      s = i ;
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m

      setV[x] = c.slice(s, i);
      c2 = setV[x].slice(i-s-m);

      if (x in colN) {
        lNC--;
        if (x in colCN) {
          colCV[colCN[x]] = colval[colN[x]] = c2.toString("utf-8");
          lNC--
        } else colval[colN[x]] = c2.toString("utf-8")

      } else if (x in colCN) {
        colCV[colCN[x]] = c2.toString("utf-8")
        lNC--;

      }
      if (lNC == 0) {
        s=i
        i=offs+1
        m = n = 0;
        while(n<c[offs]-1){
            m += c[i] * (250 ** n)
            n++;
            i++;
        }
        i+=m
        r = c.slice(s, i)
        break
      }

    }

    if (chekCond(id_, colval, colCV)) {
      let newC,lenId,ids = [];
      for (c in colval) {
        if (c in cn) {
          newC = Buffer.from(''+colval[c]);
          setV[cn[c][0]] = [...cn[c][1], 254, ...base(250, newC.length), 253, ...newC]
        }
      }

      for (c in setV) {
          ids.push(...setV[c])

      }
      if(ids.length){
        if (r) {
          lenId = i-offs
          ids.push(...r)

        }
        else{
          lenId = i+1-offs
          ids.push(255)
        }

        let d_l = base(250, ids.length)
        ids.unshift(d_l.length+1,...d_l);

        rUpd[oi.vId] = {
          o: [oi[0][2], oi[0][3]],
          ids: ids,
          newLen: ids.length,
          lenId: lenId,
        }
        return true;
      }
    }
  }

  function chng(oi, rUpd, d, newLen) {
    let c = oi.idFr,
    offs = oi[0][3], i = offs+1,
    m = n = 0;
    while(n<c[offs]-1){
        m += c[i] * (250 ** n)
        n++;
        i++;
    }
    i+=m

    rUpd[oi.vId] = {
      o: [oi[0][2], oi[0][3]],
      ids: d,
      newLen: newLen,
      lenId: i-offs,
    }
  }

  function chngIf(id_, oi, rUpd, colN, colval_, colCN, colSV_, cn, lNC, chekCond) {
    let c2, c = oi.idFr,
    colval = {
      ...colval_,
    },
    colCV = {
      ...colSV_,
    };

    let m , x, n , offs = oi[0][3], i = offs+c[offs];

    while(c[i]!=255){
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m

      c2 = c.slice(i-m,i);
      if (x in colN) {
        lNC--;
        if (x in colCN) {
          colCV[colCN[x]] = colval[colN[x]] = c2.toString("utf-8");
          lNC--
        } else colval[colN[x]] = c2.toString("utf-8")

      } else if (x in colCN) {
        colCV[colCN[x]] = c2.toString("utf-8")
        lNC--;

      }
      if (lNC == 0) {
        i=offs+1
        m = n = 0;
        while(n<c[offs]-1){
            m += c[i] * (250 ** n)
            n++;
            i++;
        }
        i+=m
        break
      }

    }

    if (chekCond(id_, colval, colCV)) {
      let newC,lenId,ids = [],setV = {};
      for (c in colval) {
        if (c in cn) {
          newC = Buffer.from(''+colval[c]);
          setV[cn[c][0]] = [...cn[c][1], 254, ...base(250, newC.length), 253, ...newC]
        }
      }

      for (c in setV) {
          ids.push(...setV[c])

      }

      if(ids.length){
        if (lNC) {
          lenId = i+1-offs
          ids.push(255)

        }
        else{
          lenId = i-offs
        }

        let d_l = base(250, ids.length)
        ids.unshift(d_l.length+1,...d_l);

        rUpd[oi.vId] = {
          o: [oi[0][2], oi[0][3]],
          ids: ids,
          newLen: ids.length,
          lenId: lenId,
        }
        return true;
      }

    }
  }

  function iDel(oi, rUpd) {
    let c = oi.idFr,
    offs = oi[0][3], i = offs+1,
    m = n = 0;
    while(n<c[offs]-1){
        m += c[i] * (250 ** n)
        n++;
        i++;
    }
    i+=m
    rUpd[oi.vId] = {
      o: [oi[0][2], oi[0][3]],
      lenId: i-offs,
    }
  }

  function iDelIf(id_, oi, rUpd, colN, colval_, cn, lN, chekCond) {

    let c = oi.idFr,
    colval = {
        ...colval_,
      };

    let m , x, n, i = oi[0][3]+c[oi[0][3]];
    while(c[i]!=255){
      x = n = 0;
      while(c[i]!=254){
          x += c[i] * (250 ** n)
          n++;
          i++;
      }
      i++;
      m = n = 0;
      while(c[i]!=253){
          m += c[i] * (250 ** n)
          n++;
          i++;
      }
      i+=1+m
      if (x in colN) {
              colval[colN[x]] = c.toString("utf-8", i-m, i);
              lN--;
              if (lN == 0){
                i=offs+1
                m = n = 0;
                while(n<c[offs]-1){
                    m += c[i] * (250 ** n)
                    n++;
                    i++;
                }
                i+=m
                break
              }
            }

    }

    if (chekCond(id_, colval)) {
      let lenId;
      if (lN) 
          lenId = i+1-offs  
      else
        lenId = i-offs

      rUpd[oi.vId] = {
        o: [oi[0][2], oi[0][3]],
        lenId: lenId,
      }
      return true;
    }
  }

  function getOffs(oi) {
    let vId = oi.vId,
      b = oi.b,
      s = oi.s,
      chunk;
    if (vId > 0) chunk = segment(vId, oi, s);
    else {
      if (b != 1) {
        oi.b -= 1;
        b = oi.b
        s = oi.s = b + 3
        fs.close(oi.idxF, function (argument) { })
        oi.idxF = fs.openSync(oi._pathX + b + ".hoc", 'r');
        vId = oi.vId = oi.vId1 = oi.vl[b + 1] - oi.vl[b]
        chunk = segment(vId, oi, s)
      } else {

        return
      }
    }
    if (chunk.length == 0) {
      if (oi.vl.length - 1 != b) {
        oi.b += 1;
        b = oi.b;
        s = oi.s = b + 3;
        fs.close(oi.idxF, function (argument) { });
        oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r");
        vId = oi.vId = oi.vId1 = 1;
        chunk = segment(vId, oi, s)
      } else {

        return
      }
    }
    let f = B(chunk, b);
    if ((chunk[0] | 0x7f) == 255) {
      oi[0] = 0;
      return 1
    }
    let n, oD = chunk[b] * 65536 + chunk[b + 1] * 256 + chunk[b + 2];
    if (f != oi.f) {
      oi.f = f;
      oi.idFr = fs.readFileSync(oi._pathD + f + ".txt");
      n = 1
      while (oi[n]) {
        oi[n] = null
        n++
      }
    }
    if (1) {
      let x, r = vId % 10;
      if (r) {
        oi[0] = [vId, f, oD, oD]
      } else {
        oi[0] = [vId, f, oD, 0]
      }
      vId = (vId - r) / 10;
      n = 0
      while (vId) {
        n++
        x = vId * 10 ** n

        if (oi[n] && oi[n][0] == x) {
          if (oi[n][1] != oi.f)
            n--
          break
        } else {
          chunk = segment(x, oi, s);
          f = B(chunk, b);
          oD = chunk[b] * 65536 + chunk[b + 1] * 256 + chunk[b + 2];
          if (f == oi.f) {
            r = vId % 10;
            if (r) {
              oi[n] = [x, f, oD, oD]
            } else {
              oi[n] = [x, f, oD, 0]
            }
          } else {
            n--
            break
          }
        }
        vId = (vId - r) / 10
      }
      while (n) {
        oi[n - 1][3] += oi[n][3];
        n -= 1
      }
    }
    return 1;
  }

  function upd_offs(oi, updInfo) {
    let vId = oi.vId,
      b = oi.b,
      s = oi.s,
      chunk;
    if (vId > 0) chunk = segment(vId, oi, s);
    else {
      let l_rUpd;
      if ((l_rUpd = Object.keys(updInfo.rUpd).length) != 0) {
        if (updInfo.del)
          saveD(oi, updInfo.rUpd);
        else saveU(oi, updInfo.rUpd);
        updInfo.len_rUpd += l_rUpd;
        updInfo.rUpd = {}
      }
      if (b != 1) {
        oi.b -= 1;
        b = oi.b;
        s = oi.s = b + 3;
        fs.close(oi.idxF, function (argument) { });
        oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
        vId = oi.vId = oi.vId1 = oi.vl[b + 1] - oi.vl[b];
        chunk = segment(vId, oi, s)
      } else {

        return
      }
    }
    if (chunk.length == 0) {
      let l_rUpd;
      if ((l_rUpd = Object.keys(updInfo.rUpd).length) != 0) {
        if (updInfo.del)
          saveD(oi, updInfo.rUpd);
        else saveU(oi, updInfo.rUpd);
        updInfo.len_rUpd += l_rUpd;
        updInfo.rUpd = {}
      }
      if (oi.vl.length - 1 != b) {
        oi.b += 1;
        b = oi.b;
        s = oi.s = b + 3;
        fs.close(oi.idxF, function (argument) { });
        oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
        vId = oi.vId = oi.vId1 = 1;
        chunk = segment(vId, oi, s)
      } else {

        return
      }
    }
    let f = B(chunk, b);
    if ((chunk[0] | 0x7f) == 255) {
      oi[0] = 0;
      return 1
    }
    let n, oD = chunk[b] * 65536 + chunk[b + 1] * 256 + chunk[b + 2];
    if (f != oi.f) {
      let l_rUpd;
      if ((l_rUpd = Object.keys(updInfo.rUpd).length) != 0) {
        if (updInfo.del)
          saveD(oi, updInfo.rUpd);
        else saveU(oi, updInfo.rUpd);
        updInfo.len_rUpd += l_rUpd;
        updInfo.rUpd = {}
      }
      oi.f = f;
      oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");
      oi.xf = chunk.slice(0, b);
      n = 1
      while (oi[n]) {
        oi[n] = null
        n++
      }
    }
    if (1) {
      let x, r = vId % 10;
      if (r) {
        oi[0] = [vId, f, oD, oD]
      } else {
        oi[0] = [vId, f, oD, 0]
      }
      vId = (vId - r) / 10;
      n = 0;
      while (vId) {
        n++
        x = vId * 10 ** n

        if (oi[n] && oi[n][0] == x) {
          if (oi[n][1] != oi.f)
            n--
          break
        } else {
          chunk = segment(x, oi, s);
          if (chunk.length == 0) {
            chunk = Buffer.alloc(s);
            fs.readSync(oi.idxF, chunk, 0, s, x * s)
          }
          f = B(chunk, b);
          oD = chunk[b] * 65536 + chunk[b + 1] * 256 + chunk[b + 2];
          if (f == oi.f) {
            r = vId % 10;
            if (r) {
              oi[n] = [x, f, oD, oD]
            } else {
              oi[n] = [x, f, oD, 0]
            }
          } else {
            n--
            break
          }
        }
        vId = (vId - r) / 10
      }
      while (n) {
        oi[n - 1][3] += oi[n][3];
        n -= 1
      }
    }
    return 1;
  }
  this.createDatabase = function (db) {
    let sT = Date.now();
    if (typeof db != 'string') {
      return {
        error: {error: "The 1st parameter 'db' must be 'string'"}
      }
    }
    else if(db.trim() === '') return {
                  error: {error: "The 1st parameter 'db' cannot be the empty string or all whitespace"}
                }
    if (!isDir(db)){ 
      db = split(db, "/");
      let db_ = "";
      for (let d of db) {
        db_ += d;
        if (!isDir(db_)) {
          fs.mkdirSync(path_mod.join(db_, ""))
        }
        db_ += "/"
      }
    }
    else return {
          error: {error: "This Database exists .."}
        }
    return {
      time: (Date.now() - sT) + ' ms',
      statement: !0
    }
  };
  this.createTable = function (db, table = !1, clmn = [], dflt = []) {
    let sT = Date.now();
    if (typeof db != 'string') {
      return {
        error: {error: "The 1st parameter 'db' must be 'string'"}
      }
    }
    else if(db.trim() === '') return {
                  error: {error: "The 1st parameter 'db' cannot be the empty string or all whitespace"}
                }
    if (typeof table != 'string') {
      return {
        error: {error: "The 2nd parameter 'table' must be 'string'"}
      }
    }
    else if(table.trim() === '') return {
                  error: {error: "The 2nd parameter 'table' cannot be the empty string or all whitespace"}
                }
    if (!isDir(db))
      return {
        error: {error: "This database not found .."}
      }
    const pathTb = `${db}/${table}`;
    if (!isDir(pathTb)) {
      if (!Array.isArray(clmn))
        return {
          error: {error: "The 3rd parameter 'clmn' must a array .. "}
        };
      if (!Array.isArray(dflt))
        return {
          error: {error: "The 4th parameter 'dflt' must a array .. "}
        };
      fs.mkdirSync(pathTb);
      fs.mkdirSync(pathTb + "/d");
      fs.mkdirSync(pathTb + "/i");
      const refContent = "0|1\n" + "0|0|0|0\n" + "0|0|0|0|0|0|0|0|0|0|0";
      fs.writeFileSync(pathTb + "/i/ref.txt", refContent);
      const fIbContent = Buffer.alloc(4, " ");
      fs.writeFileSync(pathTb + "/i/i1.hoc", fIbContent);
      if (clmn.length != 0) {
        initialCol(pathTb, clmn, dflt)
      } else {
        const refColContent = "0,{}";
        fs.writeFileSync(pathTb + "/i/refCol.txt", refColContent)
      }
      fs.writeFileSync(pathTb + "/d/b0.txt", "")
    } else {
      return {
        error: {error: "This table exists .."}
      }
    }
    return {
      time: (Date.now() - sT) + ' ms',
      statement: !0
    }
  };

  function check_in_params(pathDB, table, ids, lim) {
    let chk = {}
    if (typeof table != 'string')
      return {
        error: {error: "The 1st parameter 'table' must be 'string'"}
      };
    else if(table.trim() === '') return {
                  error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                }
    chk.pathTb = `${pathDB}/${table}`;
    if (!fs.existsSync(chk.pathTb))
      return {
        error: {error: "This table not found.."}
      };
    if (!Array.isArray(ids))
      return {
        error: {error: " The 2nd ids must a array .. "}
      };
    if (ids.some(function (item) {
      return !Number.isInteger(item)
    })) {
      return {
        error: {error: "all __ IDs array items must a number"}
      }
    }
    if (Number.isInteger(lim)) {
      if (lim < 0)
        return {
          error: {error: "The 3rd argument (lim) ​​must be equal to or greater than zero"}
        }
    } else return {
      error: {error: "The 3rd argument (lim) must a number"}
    };
    let vlsp = refData(chk.pathTb),
      [vl, ifl] = vlsp;
    let lastId = ifl[0];
    if(lastId){
      if (Math.min(...ids) < 1 || lastId < Math.max(...ids))
        return {
          error: {error: "all IDs array items must be equal to or less than the lastId: " + (lastId + 1),
          count: 0,
          rows: []}
        };
    }
    else{
      return {
          error: {record_statut: "Table has no record inserted (The table is empty)" ,
          count: 0,
          rows: []}
        };
    }
    chk = {
      ...chk,
      vlsp: vlsp,
      vl: vl,
      ifl: ifl
    }
    return chk
  }

  function check_params(pathDB, table, id_, offs, lim) {
    let chk = {}
    if (typeof table != 'string')
      return {
        error: {error: "The 1st parameter 'table' must be 'string'"}
      };
    else if(table.trim() === '') return {
                  error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                }
    chk.pathTb = `${pathDB}/${table}`;
    if (!fs.existsSync(chk.pathTb))
      return {
        error: {error: "This table not found.."}
      };
    if (Number.isInteger(id_)) {
      if (id_ < 0)
        return {
          error: {error: "The 2nd argument (Id) ​​must be equal to or greater than zero"}
        }
    } else return {
      error: {error: "The 2nd argument (Id) must a number"}
    };
    if (Number.isInteger(offs) && offs) {
      chk.offsNum = !0
    } else if (typeof offs == "string" && (offs == "+" || offs == "-")) {
      chk.offsNum = !1
    } else return {
      error: {error: 'The 3rd argument (offs) must be greater or less than 0 or this "+" or "-" character'}
    };
    if (Number.isInteger(lim)) {
      if (lim < 0)
        return {
          error: {error: "The 4nd argument (lim) ​​must be equal to or greater than zero"}
        }
    } else return {
      error: {error: "The 4th argument (lim) must a number"}
    };
    let vlsp = refData(chk.pathTb),
      [vl, ifl] = vlsp;
    let lastId = ifl[0];
    if(lastId){
      if (id_ == 0) id_ = lastId;
      if (lastId < id_)
        return {
          error: {error: "The Id must be equal to or less than the lastId: " + (lastId + 1)}
        };
    }
    else{
      return {
          error: {record_statut: "Table has no record inserted (The table is empty)" ,
          count: 0,
          rows: []}
        };
    }

    chk = {
      ...chk,
      vlsp: vlsp,
      vl: vl,
      ifl: ifl,
      id_: id_,
      lastId: lastId
    }
    return chk
  }

  function check_insert_params(pathDB, table, clmn) {
    if (typeof table != 'string') {
      return {
        error: {error: "The 1st parameter 'table' must be 'string'"}
      }
    }
    else if(table.trim() === '') return {
                  error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                }
    let pathTb = `${pathDB}/${table}`;
    if (!fs.existsSync(pathTb)) {
      return {
        error: {error: "This table not found.."}
      }
    }
    if (clmn !== "*" && !Array.isArray(clmn)) {
      return {
        error: {error: " Columns must a array .. "}
      }
    }

    return {
      pathTb: pathTb,
      clmn: clmn,
      clmnL: clmn.length
    }
  }

  function updDO(f,pathTb,updInfo,oi,ifl,vlsp) {
    let l_rUpd;
    if ((l_rUpd = Object.keys(updInfo.rUpd).length) != 0) {
      f(oi, updInfo.rUpd);
      updInfo.len_rUpd += l_rUpd
    }
    fs.close(oi.idxF, function (argument) { });
    if (oi.difOffs && ifl[2] == oi.f) {
      let doLast = vlsp[2];

      let n = 1;
      while (n <= oi.difOffs[1]) {
        doLast[n] += oi.difOffs[0];
        n += 1
      }

      let ifl = vlsp[1];
      ifl[3] = ifl[3] + oi.difOffs[0];
      fs.writeFileSync(pathTb + "/i/ref.txt", vlsp[0].join("|") + "\n" + ifl.join("|") + "\n" + doLast.join("|"))
      oi.difOffs = 0;
    }
  }

  this.connectDB = function (db) {
    var pathDB = `${DB_dir_path}/${db}`;
    if (typeof db != 'string')
      return {
        error: {error: "The 1st parameter 'db' must be 'string'"}
      };
    else if(db.trim() === '') return {
                  error: {error: "The 1st parameter 'db' cannot be the empty string or all whitespace"}
                }
    if (!fs.existsSync(pathDB))
      return {
        error: {error: "This database not found.."}
      };
    return new (class {
      constructor() { }
      addColumn = function (table, clmn = [], dflt = []) {
        let sT = Date.now();
        if (typeof table != 'string') {
          return {
            error: {error: "The 1st parameter 'table' must be 'string'"}
          }
        }
        else if(table.trim() === '') return {
                      error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                    }
        let col_L = clmn.length;
        if (col_L) {
          let pathTb = `${pathDB}/${table}`;
          if (!fs.existsSync(pathTb)) {
            return {
              error: {error: "This table not found.."}
            }
          }
          let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8");
          let sp = split(refCol, ",", 1),
            idx = Number(sp[0]);
          let colName = JSON.parse(sp[1]),
            ld = dflt.length;
          let c, i = 0,
            dflt_;
          for (; i < col_L; i++) {
            c = clmn[i];
            if (!(c in colName)) {
              if (i < ld) {
                dflt_ = ''+dflt[i]
              } else {
                dflt_ = ""
              }
              colName[c] = [idx + i, dflt_]
            } else {
              return {
                error: {error: 'The column ("' + c + '") already exists'}
              }
            }
          }
          fs.writeFileSync(pathTb + "/i/refCol.txt", (idx + i) + "," + JSON.stringify(colName))
        }
        return {
          time: (Date.now() - sT) + ' ms',
          statement: !0
        }
      };
      idIsLife = function (table, id_) {
        let sT = Date.now();
        if (typeof table != 'string') {
          return {
            time: (Date.now() - sT) + ' ms',
            error: {error: "The 1st parameter 'table' must be 'string'"}
          }
        }
        else if(table.trim() === '') return {
                      error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                    }
        if (Number.isInteger(id_)) {
          if (id_ < 0)
            return {
              error: {error: "The 2nd argument (Id) ​​must be equal to or greater than zero"}
            }
        } else return {
          error: {error: "The 2nd argument (Id) must a number"}
        };
        let pathTb = `${pathDB}/${table}`;
        if (!fs.existsSync(pathTb)) {
          return {
            error: {error: "This table not found.."}
          }
        }
        let [vl, ifl] = refData(pathTb);
        let lastId = ifl[0];
        if(lastId){
          if (id_ == 0) id_ = lastId;
          if (lastId < id_)
            return {
              error: {error: "The Id must be equal to or less than the lastId: " + (lastId + 1),
              count: 0}
            };
        }
        else{
          return {
              error: {record_statut: "Table has no record inserted (The table is empty)" ,
              count: 0}
            };
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let s = b + 3,
          vId = id_ - vl[b] + 1,
          idxF = fs.openSync(pathTb + "/i/i" + b + ".hoc", "r"),
          chunk = Buffer.alloc(1);
        if (fs.readSync(idxF, chunk, 0, 1, vId * s) != 0) {
          if ((chunk[0] | 0x7f) != 255) {
            fs.close(idxF, function (argument) { })
            return {
              time: (Date.now() - sT) + ' ms',
              count: 1,
            }
          }
        }
        fs.close(idxF, function (argument) { })
        return {
          time: (Date.now() - sT) + ' ms',
          count: 0,
        }
      };
      lastId = function (table) {
        let sT = Date.now();
        if (typeof table != 'string') {
          return {
            error: {error: "The 1st parameter 'table' must be 'string'"}
          }
        }
        else if(table.trim() === '') return {
                      error: {error: "The 1st parameter 'table' cannot be the empty string or all whitespace"}
                    }
        let pathTb = `${pathDB}/${table}`;
        if (!fs.existsSync(pathTb)) {
          return {
            error: {error: "This table not found.."}
          }
        }
        let [, ifl] = refData(pathTb), lastId = ifl[0];
        return {
          time: (Date.now() - sT) + ' ms',
          lastId: lastId,
        }
      };
      insert = function (table, clmn, val) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          ca,
          clmnL
        } = colForInsert(pathDB, table, clmn);
        if (error) return error;

        if (!Array.isArray(val)) {
          return {
            error: {error: " Values must a array .. "}
          }
        }
        if (clmnL != val.length) {
          return  {error: {error: " Incorrect number of values: Column ("+clmnL+") and Values ("+val.length+") sizes don't match "}}
        }

        let [vl, ifl, do_] = refData(pathTb), fz = vl.length - 1, b_z = 2 ** (8 * fz - 1), i_ = ifl[0], i = ifl[0] - ifl[1], vId = ifl[1] + 1, z = ifl[2], len_ = ifl[3], z_ = z, zs = [z_ & 0x7f];
        z_ >>= 7;
        while (z_ > 0) {
          zs.push(z_ & 0xff);
          z_ >>= 8
        }
        var v, l0, d_l, d = [],
          fDb = fs.openSync(pathTb + `/d/b${z}.txt`, "a"),
          fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
        let c, ii, m;

        for (c in ca) {
          v = Buffer.from(''+val[ca[c][0]]);
          d.push(...ca[c][1],254,...base(250, v.length),253,...v)

        }
        d.push(255);
        d_l = base(250, d.length)
        d.unshift(d_l.length+1,...d_l);
        ii = vId;
        m = 0;
        while (ii % 10 == 0) {
          m += 1;
          do_[m] = len_;
          ii = ii / 10
        }
        l0 = len_ - do_[m + 1];
        fs.writeFileSync(fDb, Buffer.from(d));
        fs.writeFileSync(fIb, Buffer.from([...zs, ...to_3_Bytes(l0)]));
        len_ += d.length;
        if (len_ > fsz) {
          z += 1;
          len_ = 0;
          do_ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          if (z % b_z == 0) {
            i += vId;
            vId = 0;
            fz += 1;
            b_z = 2 ** (8 * fz - 1);
            vl.push(i + 1);
            fs.close(fIb, function (argument) { });
            fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
            fs.writeFileSync(fIb, Buffer.alloc(fz + 3, " "))
          }
          z_ = z;
          zs = [z_ & 0x7f];
          z_ >>= 7;
          while (z_ > 0) {
            zs.push(z_ & 0xff);
            z_ >>= 8
          }
          fs.close(fDb, function (argument) { });
          fDb = openSync(pathTb + "/d/b" + z + ".txt", "wb")
        }
        fs.close(fIb, function (argument) { });
        fs.close(fDb, function (argument) { });
        i += vId;
        if (i != i_) {
          fs.writeFileSync(pathTb + "/i/ref.txt", vl.join("|") + "\n" + (i + "|" + vId + "|" + z + "|" + len_) + "\n" + do_.join("|"))
        }
        return {
          time: (Date.now() - sT) + ' ms',
          count: 1,
          id: i,
        }
      };
      insertMany = function (table, clmn, vals) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          ca,
          clmnL
        } = colForInsert(pathDB, table, clmn);
        if (error) return error;

        var vals_L;
        if (!Array.isArray(vals) || (vals_L = vals.length) == 0) {
          return {
            error: {error: " Values must a Two-dimensional array .. "}
          }
        }

        let [vl, ifl, do_] = refData(pathTb), fz = vl.length - 1, b_z = 2 ** (8 * fz - 1), i_ = ifl[0], i = ifl[0] - ifl[1], vId = ifl[1], z = ifl[2], len_ = ifl[3], z_ = z, zs = [z_ & 0x7f];
        z_ >>= 7;
        while (z_ > 0) {
          zs.push(z_ & 0xff);
          z_ >>= 8
        }
        var v, l0, d_l, d,
        fDb = fs.openSync(pathTb + `/d/b${z}.txt`, "a"),
            fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
        let c, ii, m;
        for (let val, j = 0; j < vals_L; j++) {
          val = vals[j];
          if (Array.isArray(val)) {
            if (val.length != clmnL) {
              return {error: {error: " Incorrect number of values: Column ("+clmnL+") and Values ("+val.length+") sizes don't match "}}

            }
          } else {
            return {
              error: {error: " Values must a Two-dimensional array .. "}
            }
          }

          vId += 1;
          d = []

          for (c in ca) {
            v = Buffer.from(''+val[ca[c][0]]);
            d.push(...ca[c][1],254,...base(250, v.length),253,...v)

          }
          d.push(255);
          d_l = base(250, d.length)
          d.unshift(d_l.length+1,...d_l);

          ii = vId;
          m = 0;
          while (ii % 10 == 0) {
            m += 1;

            do_[m] = len_;

            ii = ii / 10
          }

          l0 = len_ - do_[m + 1];
          fs.writeFileSync(fDb, Buffer.from(d));
          fs.writeFileSync(fIb, Buffer.from([...zs, ...to_3_Bytes(l0)]));
          len_ += d.length;
          if (len_ > fsz) {
            z += 1;
            len_ = 0;
            do_ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (z % b_z == 0) {
              i += vId;
              vId = 0;
              fz += 1;
              b_z = 2 ** (8 * fz - 1);
              vl.push(i + 1);
              fs.close(fIb, function (argument) { });
              fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
              fs.writeFileSync(fIb, Buffer.alloc(fz + 3, " "))
            }
            z_ = z;
            zs = [z_ & 0x7f];
            z_ >>= 7;
            while (z_ > 0) {
              zs.push(z_ & 0xff);
              z_ >>= 8
            }
            fs.close(fDb, function (argument) { });
            fDb = fs.openSync(pathTb + `/d/b${z}.txt`, "a")
          }
        }

        i += vId;
        fs.close(fIb, function (argument) { });
        fs.close(fDb, function (argument) { });
        if (i != i_) {
          fs.writeFileSync(pathTb + "/i/ref.txt", vl.join("|") + "\n" + (i + "|" + vId + "|" + z + "|" + len_) + "\n" + do_.join("|"))
        }
        return {
          time: (Date.now() - sT) + ' ms',
          count: i - i_,
          id: i,
        }
      };
      insertCsv = function (table, csvFP, clmn, option = {}) {
        var {
          error,
          pathTb,
          ca,
          clmnL
        } = colForInsert(pathDB, table, clmn);
        if (error) return error;
        if (typeof csvFP != 'string') {
          return {error: {error: "The 2nd parameter file path 'csvFP' must be 'string'"}}
        }
        else if(csvFP.trim() === '') return {
                      error: {error: "The 2nd parameter file path 'csvFP' cannot be the empty string or all whitespace"}
                    }
        if (typeof option != 'object') {
          return {error: {error: "The 4th parameter 'option' must be 'object'"}}
        }
        option.json = !1;
        const parse = parseCsv(csvFP, option);
        function callCSV(type) {
          return function (...args) {
            let sT = Date.now();
            let [vl, ifl, do_] = refData(pathTb), fz = vl.length - 1, b_z = 2 ** (8 * fz - 1), i_ = ifl[0], i = ifl[0] - ifl[1], vId = ifl[1], z = ifl[2], len_ = ifl[3], z_ = z, zs = [z_ & 0x7f];
            z_ >>= 7;
            while (z_ > 0) {
              zs.push(z_ & 0xff);
              z_ >>= 8
            }
            let result, vals, vals_L;

            if (type == "chunk") result = parse.chunk(...args);
            else if (type == "rowOffset") result = parse.rowOffset(...args);
            if (result.error) 
              return result;

            if (result.row_count) vals = result.rows;
            if (!Array.isArray(vals)) {
              return {error: {error: " Incorrect CSV format: rows must be an array "}}
            } 
            if ((vals_L = vals.length) == 0) {
              return {error: {error: " CSV file rows are empty, no data is displayed "}}
            }
            var v, l0, d_l, d,
            fDb = fs.openSync(pathTb + `/d/b${z}.txt`, "a"),
              fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
            let c, ii, m;
            for (var val, j = 0; j < vals_L; j++) {
              val = vals[j];
              if (Array.isArray(val)) {
                if (val.length != clmnL) {
                  return {error: {error: " Incorrect number of columns: Header ("+clmnL+") and Row ("+val.length+") sizes don't match "}}
                }
              } else {
                return {error: {error: " Incorrect CSV Format. Number of headers and the number of values in each row must be equal "}}
              }

              vId += 1;
              d = []

              for (c in ca) {
                v = Buffer.from(''+val[ca[c][0]]);
                d.push(...ca[c][1],254,...base(250, v.length),253,...v)

              }
              d.push(255);
              d_l = base(250, d.length)
              d.unshift(d_l.length+1,...d_l);
              ii = vId;
              m = 0;
              while (ii % 10 == 0) {
                m += 1;
                do_[m] = len_;
                ii = ii / 10
              }
              l0 = len_ - do_[m + 1];
              fs.writeFileSync(fDb, Buffer.from(d));
              fs.writeFileSync(fIb, Buffer.from([...zs, ...to_3_Bytes(l0)]));
              len_ += d.length;
              if (len_ > fsz) {
                z += 1;
                len_ = 0;
                do_ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                if (z % b_z == 0) {
                  i += vId;
                  vId = 0;
                  fz += 1;
                  b_z = 2 ** (8 * fz - 1);
                  vl.push(i + 1);
                  fs.close(fIb, function (argument) { });
                  fIb = fs.openSync(pathTb + `/i/i${fz}.hoc`, "a");
                  fs.writeFileSync(fIb, Buffer.alloc(fz + 3, " "))
                }
                z_ = z;
                zs = [z_ & 0x7f];
                z_ >>= 7;
                while (z_ > 0) {
                  zs.push(z_ & 0xff);
                  z_ >>= 8
                }
                fs.close(fDb, function (argument) { });
                fDb = fs.openSync(pathTb + `/d/b${z}.txt`, "a")
              }
            }
            i += vId;
            fs.close(fIb, function (argument) { });
            fs.close(fDb, function (argument) { });
            if (i != i_) {
              fs.writeFileSync(pathTb + "/i/ref.txt", vl.join("|") + "\n" + (i + "|" + vId + "|" + z + "|" + len_) + "\n" + do_.join("|"))
            }
            return {
              time: (Date.now() - sT) + ' ms',
              count: i - i_,
              id: i,
            }
          }
        }
        return new (class {
          constructor() { }
          chunk = callCSV("chunk");
          rowOffset = callCSV("rowOffset")
        })()
      };
      select = function (table, id_, offs, lim, clmn = "*") {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1])
        var {
          error,
          colN,
          colval
        } = getCol(colName, clmn, 'colN', 'colval');
        if (error) return error;
        let lN = Object.keys(colN).length;
        var rows = [];
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN));
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN))
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN));
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN))
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN));
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN))
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN));
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    rows.push(slc({
                      id: id_,
                      ...colval
                    }, colN, oi.idFr, oi[0][3], lN))
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        fs.close(oi.idxF, function (argument) { })
        return {
          time: (Date.now() - sT) + ' ms',
          count: rows.length,
          rows: rows,
        }
      };
      selectIn = function (table, ids, lim, clmn = "*") {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1])
        var {
          error,
          colN,
          colval
        } = getCol(colName, clmn, 'colN', 'colval');
        if (error) return error;
        let lN = Object.keys(colN).length;
        var rows = [];
        var s = 3,
          b2 = 1,
          b = 0;
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            getOffs(oi);
            if (oi[0]) {
              rows.push(slc({
                id: id_,
                ...colval
              }, colN, oi.idFr, oi[0][3], lN))
            }
            lim--
            if (lim == 0)
              break
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            getOffs(oi);
            if (oi[0]) {
              rows.push(slc({
                id: id_,
                ...colval
              }, colN, oi.idFr, oi[0][3], lN))
            }
          }
        fs.close(oi.idxF, function (argument) { });
        return {
          time: (Date.now() - sT) + ' ms',
          count: rows.length,
          rows: rows,
        }
      };
      search = function (table, id_, offs, lim, clmn = "*", coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1])
        var {
          error,
          colN,
          colval
        } = getCol(colName, clmn, 'colN', 'colval');
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var rows = [],
          row;
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row);
                      lim--;
                      if (!lim) break
                    }
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row)
                    }
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row);
                      lim--;
                      if (!lim) break
                    }
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row)
                    }
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row);
                      lim--;
                      if (!lim) break
                    }
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row)
                    }
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row);
                      lim--;
                      if (!lim) break
                    }
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (getOffs(oi)) {
                  if (oi[0]) {
                    row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
                    if (row) {
                      rows.push(row)
                    }
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        fs.close(oi.idxF, function (argument) { });
        return {
          time: (Date.now() - sT) + ' ms',
          count: rows.length,
          rows: rows,
        }
      };
      searchIn = function (table, ids, lim, clmn = "*", coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1])
        var {
          error,
          colN,
          colval
        } = getCol(colName, clmn, 'colN', 'colval');
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var rows = [],
          row;
        var s = 3,
          b2 = 1,
          b = 0;
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            getOffs(oi);
            if (oi[0]) {
              row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
              if (row) {
                rows.push(row)
              }
            }
            lim--
            if (lim == 0)
              break
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            getOffs(oi);
            if (oi[0]) {
              row = srch(id_, oi, colN, colval, colCN, colCV, lNC, chekCond);
              if (row) {
                rows.push(row)
              }
            }
          }
        fs.close(oi.idxF, function (argument) { });
        return {
          time: (Date.now() - sT) + ' ms',
          count: rows.length,
          rows: rows,
        }
      };

      update = function (table, id_, offs, lim, clmn, vals) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        var {
          error,
          setV
        } = colForUpd(pathTb, clmn, vals);
        if (error) return error;
        let ls = Object.keys(setV).length;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls);
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls);
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls);
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls);
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    upd(oi, updInfo.rUpd, setV, ls)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }            
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      updateIn = function (table, ids, lim, clmn, vals) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        var {
          error,
          setV
        } = colForUpd(pathTb, clmn, vals);
        if (error) return error;
        let ls = Object.keys(setV).length;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              upd(oi, updInfo.rUpd, setV, ls)
            }
            lim--
            if (lim == 0)
              break
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              upd(oi, updInfo.rUpd, setV, ls)
            }
          }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      updateIf = function (table, id_, offs, lim, clmn, coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, clmn);
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    if(updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                      lim--;
                      if (!lim) break
                    }
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    if(updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                      lim--;
                      if (!lim) break
                    }
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    if(updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                      lim--;
                      if (!lim) break
                    }
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    if(updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                      lim--;
                      if (!lim) break
                    }
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      updateInIf = function (table, ids, lim, clmn, coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, clmn);
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              if(updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                lim--
                if (lim == 0)
                  break
              }
            }
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              updIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
            }
          }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      change = function (table, id_, offs, lim, clmn, vals) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        var {
          error,
          setV
        } = colForUpd(pathTb, clmn, vals);
        if (error) return error;

        let d_l, d = [];

        for (let x in setV) {
          d.push(...setV[x])
        }
        d.push(255)
        d_l = base(250, d.length)
        d.unshift(d_l.length+1,...d_l);

        var newLen = d.length;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        };
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen);
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen);
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen);
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen);
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chng(oi, updInfo.rUpd, d, newLen)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      changeIn = function (table, ids, lim, clmn, vals) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        var {
          error,
          setV
        } = colForUpd(pathTb, clmn, vals);
        if (error) return error;

        let d_l, d = [];

        for (let x in setV) {
          d.push(...setV[x])
        }
        d.push(255)
        d_l = base(250, d.length)
        d.unshift(d_l.length+1,...d_l);

        var newLen = d.length;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              chng(oi, updInfo.rUpd, d, newLen)
            }
            lim--
            if (lim == 0)
              break
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              chng(oi, updInfo.rUpd, d, newLen)
            }
          }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      changeIf = function (table, id_, offs, lim, clmn, coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, clmn);
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      changeInIf = function (table, ids, lim, clmn, coClmn = "*", chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, clmn);
        if (error) return error;
        var {
          error,
          colCN,
          colCV
        } = getCol(colName, coClmn, 'colCN', 'colCV');
        if (error) return error;
        let lNC = Object.keys(colN).length + Object.keys(colCN).length;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              if(chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)){
                lim--
                if (lim == 0)
                  break
              }
            }
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              chngIf(id_, oi, updInfo.rUpd, colN, colval, colCN, colCV, cn, lNC, chekCond)
            }
          }
        updDO(saveU,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      delete = function (table, id_, offs, lim) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        var updInfo = {
          del: !0,
          rUpd: {},
          len_rUpd: 0
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");
        oi.xf = chunk.slice(0, b)

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd);
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd);
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd);
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd);
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDel(oi, updInfo.rUpd)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        updDO(saveD,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      deleteIn = function (table, ids, lim) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0,
          del: !0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
              oi.xf = chunk.slice(0, b)
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              iDel(oi, updInfo.rUpd)
            }
            lim--
            if (lim == 0)
              break
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
              oi.xf = chunk.slice(0, b)
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              iDel(oi, updInfo.rUpd)
            }
          }
        updDO(saveD,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      deleteIf = function (table, id_, offs, lim, coClmn, chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          offsNum,
          vlsp,
          vl,
          ifl,
          id_,
          lastId
        } = check_params(pathDB, table, id_, offs, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, coClmn);
        if (error) return error;
        let lN = Object.keys(colN).length;
        var updInfo = {
          del: !0,
          rUpd: {},
          len_rUpd: 0
        }
        let vlL = vl.length;
        for (var b = 2; b < vlL; b++) {
          if (id_ < vl[b]) {
            break
          }
        }
        b -= 1;
        let vId = id_ - vl[b] + 1;
        var oi = {
          b: b,
          s: b + 3,
          vl: vl,
          vId: vId,
          vId1: vId,
          vId0: vId,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + oi.b + ".hoc", "r+");
        let chunk = segment(vId, oi, oi.s);
        oi.f = B(chunk, b);
        oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt");
        oi.xf = chunk.slice(0, b)

        if (1) {
          if (offsNum) {
            if (offs > 0) {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)
                  }
                  offs -= 1;
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (offs && upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)
                  }
                  offs += 1;
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          } else {
            if (offs == "+") {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)
                  }
                  id_ += 1;
                  oi.vId += 1;
                }
              }
            } else {
              if (lim) {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond);
                    lim--;
                    if (!lim) break
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              } else {

                while (upd_offs(oi, updInfo)) {
                  if (oi[0]) {
                    iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)
                  }
                  id_ -= 1;
                  oi.vId -= 1;
                }
              }
            }
          }
        }
        updDO(saveD,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      };
      deleteInIf = function (table, ids, lim, coClmn, chekCond = cond) {
        let sT = Date.now();
        var {
          error,
          pathTb,
          vlsp,
          vl,
          ifl
        } = check_in_params(pathDB, table, ids, lim)
        if (error) return error;
        let refCol = fs.readFileSync(pathTb + "/i/refCol.txt", "utf8"),
          colName = JSON.parse(split(refCol, ",", 1)[1]);
        var {
          error,
          colN,
          colval,
          cn
        } = getColForUpdIf(colName, coClmn);
        if (error) return error;
        let lN = Object.keys(colN).length;
        var s = 3,
          b2 = 1,
          b = 0;
        var updInfo = {
          rUpd: {},
          len_rUpd: 0,
          del: !0
        }
        var vId, oi = {
          vl: vl,

          _pathX : pathTb + "/i/i",
          _pathD : pathTb + "/d/b"
        };
        oi.idxF = fs.openSync(oi._pathX + 1 + ".hoc", "r+");
        let chunk;
        if (lim)
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
              oi.xf = chunk.slice(0, b)
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              if(iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)){
                lim--
                if (lim == 0)
                  break
              }
            }
          } else
          for (var id_ of ids) {
            if (vl[b2] && vl[b2] <= id_) {
              b += 1;
              while (vl[b] && vl[b] <= id_) {
                b++
              }
              b2 = b;
              b -= 1;
              oi.b = b;
              fs.close(oi.idxF, function (argument) { });
              oi.idxF = fs.openSync(oi._pathX + b + ".hoc", "r+");
              vId = oi.vId = oi.vId1 = id_ - vl[b] + 1;
              s = oi.s = b + 3;
              chunk = segment(vId, oi, s);
              oi.f = B(chunk, b);
              oi.idFr = fs.readFileSync(oi._pathD + oi.f + ".txt")
              oi.xf = chunk.slice(0, b)
            } else vId = oi.vId = id_ - vl[b] + 1;
            upd_offs(oi, updInfo);
            if (oi[0]) {
              iDelIf(id_, oi, updInfo.rUpd, colN, colval, cn, lN, chekCond)
            }
          }
        updDO(saveD,pathTb,updInfo,oi,ifl,vlsp)
        return {
          time: (Date.now() - sT) + ' ms',
          count: updInfo.len_rUpd,
        }
      }
    })()
  }
}
