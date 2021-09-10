// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
/* eslint-disable global-require */
import React from 'react';
import Image from 'components/core/Image';


type Props = {
  country: string,
  width: number,
  height: number,
  radius?: number,
};

const flags = {
  AD: require('svg-country-flags/png100px/ad.png'),
  AE: require('svg-country-flags/png100px/ae.png'),
  AF: require('svg-country-flags/png100px/af.png'),
  AG: require('svg-country-flags/png100px/ag.png'),
  AI: require('svg-country-flags/png100px/ai.png'),
  AL: require('svg-country-flags/png100px/al.png'),
  AM: require('svg-country-flags/png100px/am.png'),
  AN: require('svg-country-flags/png100px/an.png'),
  AO: require('svg-country-flags/png100px/ao.png'),
  AQ: require('svg-country-flags/png100px/aq.png'),
  AR: require('svg-country-flags/png100px/ar.png'),
  AS: require('svg-country-flags/png100px/as.png'),
  AT: require('svg-country-flags/png100px/at.png'),
  AU: require('svg-country-flags/png100px/au.png'),
  AW: require('svg-country-flags/png100px/aw.png'),
  AX: require('svg-country-flags/png100px/ax.png'),
  AZ: require('svg-country-flags/png100px/az.png'),
  BA: require('svg-country-flags/png100px/ba.png'),
  BB: require('svg-country-flags/png100px/bb.png'),
  BD: require('svg-country-flags/png100px/bd.png'),
  BE: require('svg-country-flags/png100px/be.png'),
  BF: require('svg-country-flags/png100px/bf.png'),
  BG: require('svg-country-flags/png100px/bg.png'),
  BH: require('svg-country-flags/png100px/bh.png'),
  BI: require('svg-country-flags/png100px/bi.png'),
  BJ: require('svg-country-flags/png100px/bj.png'),
  BL: require('svg-country-flags/png100px/bl.png'),
  BM: require('svg-country-flags/png100px/bm.png'),
  BN: require('svg-country-flags/png100px/bn.png'),
  BO: require('svg-country-flags/png100px/bo.png'),
  BQ: require('svg-country-flags/png100px/bq.png'),
  BR: require('svg-country-flags/png100px/br.png'),
  BS: require('svg-country-flags/png100px/bs.png'),
  BT: require('svg-country-flags/png100px/bt.png'),
  BV: require('svg-country-flags/png100px/bv.png'),
  BW: require('svg-country-flags/png100px/bw.png'),
  BY: require('svg-country-flags/png100px/by.png'),
  BZ: require('svg-country-flags/png100px/bz.png'),
  CA: require('svg-country-flags/png100px/ca.png'),
  CC: require('svg-country-flags/png100px/cc.png'),
  CD: require('svg-country-flags/png100px/cd.png'),
  CF: require('svg-country-flags/png100px/cf.png'),
  CG: require('svg-country-flags/png100px/cg.png'),
  CH: require('svg-country-flags/png100px/ch.png'),
  CI: require('svg-country-flags/png100px/ci.png'),
  CK: require('svg-country-flags/png100px/ck.png'),
  CL: require('svg-country-flags/png100px/cl.png'),
  CM: require('svg-country-flags/png100px/cm.png'),
  CN: require('svg-country-flags/png100px/cn.png'),
  CO: require('svg-country-flags/png100px/co.png'),
  CR: require('svg-country-flags/png100px/cr.png'),
  CU: require('svg-country-flags/png100px/cu.png'),
  CV: require('svg-country-flags/png100px/cv.png'),
  CW: require('svg-country-flags/png100px/cw.png'),
  CX: require('svg-country-flags/png100px/cx.png'),
  CY: require('svg-country-flags/png100px/cy.png'),
  CZ: require('svg-country-flags/png100px/cz.png'),
  DE: require('svg-country-flags/png100px/de.png'),
  DJ: require('svg-country-flags/png100px/dj.png'),
  DK: require('svg-country-flags/png100px/dk.png'),
  DM: require('svg-country-flags/png100px/dm.png'),
  DO: require('svg-country-flags/png100px/do.png'),
  DZ: require('svg-country-flags/png100px/dz.png'),
  EC: require('svg-country-flags/png100px/ec.png'),
  EE: require('svg-country-flags/png100px/ee.png'),
  EG: require('svg-country-flags/png100px/eg.png'),
  EH: require('svg-country-flags/png100px/eh.png'),
  ER: require('svg-country-flags/png100px/er.png'),
  ES: require('svg-country-flags/png100px/es.png'),
  ET: require('svg-country-flags/png100px/et.png'),
  EU: require('svg-country-flags/png100px/eu.png'),
  FI: require('svg-country-flags/png100px/fi.png'),
  FJ: require('svg-country-flags/png100px/fj.png'),
  FK: require('svg-country-flags/png100px/fk.png'),
  FM: require('svg-country-flags/png100px/fm.png'),
  FO: require('svg-country-flags/png100px/fo.png'),
  FR: require('svg-country-flags/png100px/fr.png'),
  GA: require('svg-country-flags/png100px/ga.png'),
  'GB-ENG': require('svg-country-flags/png100px/gb-eng.png'),
  'GB-NIR': require('svg-country-flags/png100px/gb-nir.png'),
  'GB-SCT': require('svg-country-flags/png100px/gb-sct.png'),
  'GB-WLS': require('svg-country-flags/png100px/gb-wls.png'),
  GB: require('svg-country-flags/png100px/gb.png'),
  GD: require('svg-country-flags/png100px/gd.png'),
  GE: require('svg-country-flags/png100px/ge.png'),
  GF: require('svg-country-flags/png100px/gf.png'),
  GG: require('svg-country-flags/png100px/gg.png'),
  GH: require('svg-country-flags/png100px/gh.png'),
  GI: require('svg-country-flags/png100px/gi.png'),
  GL: require('svg-country-flags/png100px/gl.png'),
  GM: require('svg-country-flags/png100px/gm.png'),
  GN: require('svg-country-flags/png100px/gn.png'),
  GP: require('svg-country-flags/png100px/gp.png'),
  GQ: require('svg-country-flags/png100px/gq.png'),
  GR: require('svg-country-flags/png100px/gr.png'),
  GS: require('svg-country-flags/png100px/gs.png'),
  GT: require('svg-country-flags/png100px/gt.png'),
  GU: require('svg-country-flags/png100px/gu.png'),
  GW: require('svg-country-flags/png100px/gw.png'),
  GY: require('svg-country-flags/png100px/gy.png'),
  HK: require('svg-country-flags/png100px/hk.png'),
  HM: require('svg-country-flags/png100px/hm.png'),
  HN: require('svg-country-flags/png100px/hn.png'),
  HR: require('svg-country-flags/png100px/hr.png'),
  HT: require('svg-country-flags/png100px/ht.png'),
  HU: require('svg-country-flags/png100px/hu.png'),
  ID: require('svg-country-flags/png100px/id.png'),
  IE: require('svg-country-flags/png100px/ie.png'),
  IL: require('svg-country-flags/png100px/il.png'),
  IM: require('svg-country-flags/png100px/im.png'),
  IN: require('svg-country-flags/png100px/in.png'),
  IO: require('svg-country-flags/png100px/io.png'),
  IQ: require('svg-country-flags/png100px/iq.png'),
  IR: require('svg-country-flags/png100px/ir.png'),
  IS: require('svg-country-flags/png100px/is.png'),
  IT: require('svg-country-flags/png100px/it.png'),
  JE: require('svg-country-flags/png100px/je.png'),
  JM: require('svg-country-flags/png100px/jm.png'),
  JO: require('svg-country-flags/png100px/jo.png'),
  JP: require('svg-country-flags/png100px/jp.png'),
  KE: require('svg-country-flags/png100px/ke.png'),
  KG: require('svg-country-flags/png100px/kg.png'),
  KH: require('svg-country-flags/png100px/kh.png'),
  KI: require('svg-country-flags/png100px/ki.png'),
  KM: require('svg-country-flags/png100px/km.png'),
  KN: require('svg-country-flags/png100px/kn.png'),
  KP: require('svg-country-flags/png100px/kp.png'),
  KR: require('svg-country-flags/png100px/kr.png'),
  KW: require('svg-country-flags/png100px/kw.png'),
  KY: require('svg-country-flags/png100px/ky.png'),
  KZ: require('svg-country-flags/png100px/kz.png'),
  LA: require('svg-country-flags/png100px/la.png'),
  LB: require('svg-country-flags/png100px/lb.png'),
  LC: require('svg-country-flags/png100px/lc.png'),
  LI: require('svg-country-flags/png100px/li.png'),
  LK: require('svg-country-flags/png100px/lk.png'),
  LR: require('svg-country-flags/png100px/lr.png'),
  LS: require('svg-country-flags/png100px/ls.png'),
  LT: require('svg-country-flags/png100px/lt.png'),
  LU: require('svg-country-flags/png100px/lu.png'),
  LV: require('svg-country-flags/png100px/lv.png'),
  LY: require('svg-country-flags/png100px/ly.png'),
  MA: require('svg-country-flags/png100px/ma.png'),
  MC: require('svg-country-flags/png100px/mc.png'),
  MD: require('svg-country-flags/png100px/md.png'),
  ME: require('svg-country-flags/png100px/me.png'),
  MF: require('svg-country-flags/png100px/mf.png'),
  MG: require('svg-country-flags/png100px/mg.png'),
  MH: require('svg-country-flags/png100px/mh.png'),
  MK: require('svg-country-flags/png100px/mk.png'),
  ML: require('svg-country-flags/png100px/ml.png'),
  MM: require('svg-country-flags/png100px/mm.png'),
  MN: require('svg-country-flags/png100px/mn.png'),
  MO: require('svg-country-flags/png100px/mo.png'),
  MP: require('svg-country-flags/png100px/mp.png'),
  MQ: require('svg-country-flags/png100px/mq.png'),
  MR: require('svg-country-flags/png100px/mr.png'),
  MS: require('svg-country-flags/png100px/ms.png'),
  MT: require('svg-country-flags/png100px/mt.png'),
  MU: require('svg-country-flags/png100px/mu.png'),
  MV: require('svg-country-flags/png100px/mv.png'),
  MW: require('svg-country-flags/png100px/mw.png'),
  MX: require('svg-country-flags/png100px/mx.png'),
  MY: require('svg-country-flags/png100px/my.png'),
  MZ: require('svg-country-flags/png100px/mz.png'),
  NA: require('svg-country-flags/png100px/na.png'),
  NC: require('svg-country-flags/png100px/nc.png'),
  NE: require('svg-country-flags/png100px/ne.png'),
  NF: require('svg-country-flags/png100px/nf.png'),
  NG: require('svg-country-flags/png100px/ng.png'),
  NI: require('svg-country-flags/png100px/ni.png'),
  NL: require('svg-country-flags/png100px/nl.png'),
  NO: require('svg-country-flags/png100px/no.png'),
  NP: require('svg-country-flags/png100px/np.png'),
  NR: require('svg-country-flags/png100px/nr.png'),
  NU: require('svg-country-flags/png100px/nu.png'),
  NZ: require('svg-country-flags/png100px/nz.png'),
  OM: require('svg-country-flags/png100px/om.png'),
  PA: require('svg-country-flags/png100px/pa.png'),
  PE: require('svg-country-flags/png100px/pe.png'),
  PF: require('svg-country-flags/png100px/pf.png'),
  PG: require('svg-country-flags/png100px/pg.png'),
  PH: require('svg-country-flags/png100px/ph.png'),
  PK: require('svg-country-flags/png100px/pk.png'),
  PL: require('svg-country-flags/png100px/pl.png'),
  PM: require('svg-country-flags/png100px/pm.png'),
  PN: require('svg-country-flags/png100px/pn.png'),
  PR: require('svg-country-flags/png100px/pr.png'),
  PS: require('svg-country-flags/png100px/ps.png'),
  PT: require('svg-country-flags/png100px/pt.png'),
  PW: require('svg-country-flags/png100px/pw.png'),
  PY: require('svg-country-flags/png100px/py.png'),
  QA: require('svg-country-flags/png100px/qa.png'),
  RE: require('svg-country-flags/png100px/re.png'),
  RO: require('svg-country-flags/png100px/ro.png'),
  RS: require('svg-country-flags/png100px/rs.png'),
  RU: require('svg-country-flags/png100px/ru.png'),
  RW: require('svg-country-flags/png100px/rw.png'),
  SA: require('svg-country-flags/png100px/sa.png'),
  SB: require('svg-country-flags/png100px/sb.png'),
  SC: require('svg-country-flags/png100px/sc.png'),
  SD: require('svg-country-flags/png100px/sd.png'),
  SE: require('svg-country-flags/png100px/se.png'),
  SG: require('svg-country-flags/png100px/sg.png'),
  SH: require('svg-country-flags/png100px/sh.png'),
  SI: require('svg-country-flags/png100px/si.png'),
  SJ: require('svg-country-flags/png100px/sj.png'),
  SK: require('svg-country-flags/png100px/sk.png'),
  SL: require('svg-country-flags/png100px/sl.png'),
  SM: require('svg-country-flags/png100px/sm.png'),
  SN: require('svg-country-flags/png100px/sn.png'),
  SO: require('svg-country-flags/png100px/so.png'),
  SR: require('svg-country-flags/png100px/sr.png'),
  SS: require('svg-country-flags/png100px/ss.png'),
  ST: require('svg-country-flags/png100px/st.png'),
  SV: require('svg-country-flags/png100px/sv.png'),
  SX: require('svg-country-flags/png100px/sx.png'),
  SY: require('svg-country-flags/png100px/sy.png'),
  SZ: require('svg-country-flags/png100px/sz.png'),
  TC: require('svg-country-flags/png100px/tc.png'),
  TD: require('svg-country-flags/png100px/td.png'),
  TF: require('svg-country-flags/png100px/tf.png'),
  TG: require('svg-country-flags/png100px/tg.png'),
  TH: require('svg-country-flags/png100px/th.png'),
  TJ: require('svg-country-flags/png100px/tj.png'),
  TK: require('svg-country-flags/png100px/tk.png'),
  TL: require('svg-country-flags/png100px/tl.png'),
  TM: require('svg-country-flags/png100px/tm.png'),
  TN: require('svg-country-flags/png100px/tn.png'),
  TO: require('svg-country-flags/png100px/to.png'),
  TR: require('svg-country-flags/png100px/tr.png'),
  TT: require('svg-country-flags/png100px/tt.png'),
  TV: require('svg-country-flags/png100px/tv.png'),
  TW: require('svg-country-flags/png100px/tw.png'),
  TZ: require('svg-country-flags/png100px/tz.png'),
  UA: require('svg-country-flags/png100px/ua.png'),
  UG: require('svg-country-flags/png100px/ug.png'),
  UM: require('svg-country-flags/png100px/um.png'),
  US: require('svg-country-flags/png100px/us.png'),
  UY: require('svg-country-flags/png100px/uy.png'),
  UZ: require('svg-country-flags/png100px/uz.png'),
  VA: require('svg-country-flags/png100px/va.png'),
  VC: require('svg-country-flags/png100px/vc.png'),
  VE: require('svg-country-flags/png100px/ve.png'),
  VG: require('svg-country-flags/png100px/vg.png'),
  VI: require('svg-country-flags/png100px/vi.png'),
  VN: require('svg-country-flags/png100px/vn.png'),
  VU: require('svg-country-flags/png100px/vu.png'),
  WF: require('svg-country-flags/png100px/wf.png'),
  XK: require('svg-country-flags/png100px/xk.png'),
  WS: require('svg-country-flags/png100px/ws.png'),
  YE: require('svg-country-flags/png100px/ye.png'),
  YT: require('svg-country-flags/png100px/yt.png'),
  ZA: require('svg-country-flags/png100px/za.png'),
  ZM: require('svg-country-flags/png100px/zm.png'),
  ZW: require('svg-country-flags/png100px/zw.png'),
};

const Flag = (props: Props) => {
  const {
    country, width, height, radius,
  } = props;
  const flag = flags[country];
  if (!flag) {
    return null;
  }
  return <Image source={flag} style={{ width, height, borderRadius: radius }} />;
};

export default Flag;
