SET NAMES utf8mb4;
-- デモ用初期データ (ポンプ・送風機の部品加工ラインを想定)

INSERT INTO m_hinmoku (hinmoku_cd, hinmoku_nm, kikaku, tani, hyojun_jikan) VALUES
 ('PMP-1000','ポンプケーシング 100A','FC250 / 鋳鉄','個',48.50),
 ('PMP-1001','ポンプケーシング 150A','FC250 / 鋳鉄','個',62.00),
 ('IMP-2200','インペラ 220mm','SCS13 / ステンレス','個',35.25),
 ('SFT-3300','主軸シャフト φ45','S45C 調質','個',28.75),
 ('MSL-4400','メカニカルシール 45A','カーボン/SiC','個',12.00),
 ('BLW-5500','送風機ケーシング','SS400','個',75.00),
 ('BRG-6600','軸受ハウジング','FC200','個',22.40);

INSERT INTO m_setsubi (setsubi_cd, setsubi_nm, line_cd, maker, dounyu_ymd, tenken_cycle) VALUES
 ('MC-101','立形マシニングセンタ','L-01','大隈鉄工','1998-04-01',30),
 ('MC-102','横形マシニングセンタ','L-01','大隈鉄工','2005-09-15',30),
 ('LT-201','NC旋盤 φ500','L-02','森精機','2001-06-20',30),
 ('LT-202','NC旋盤 φ300','L-02','森精機','2013-02-10',45),
 ('AS-301','組立コンベア','L-03','自社製作','1996-11-05',60),
 ('PT-401','静電塗装ブース','L-04','旭サナック','2009-03-30',90),
 ('CM-501','三次元測定機','L-04','ミツトヨ','2016-08-01',180);

INSERT INTO t_seizou_shiji (shiji_no,hinmoku_cd,line_cd,suryo,kanryo_suryo,furyo_suryo,noki_ymd,status,tokui_nm,bikou,toroku_ymd) VALUES
 ('SJ-2608-0001','PMP-1000','L-01',120,120,3,DATE_SUB(CURDATE(),INTERVAL 4 DAY),'完了','東海水道機工(株)','',DATE_SUB(NOW(),INTERVAL 20 DAY)),
 ('SJ-2608-0002','IMP-2200','L-02',200,168,6,DATE_ADD(CURDATE(),INTERVAL 2 DAY),'作業中','中部プラント工業','材質ロット変更あり',DATE_SUB(NOW(),INTERVAL 18 DAY)),
 ('SJ-2608-0003','SFT-3300','L-02',150,150,1,DATE_SUB(CURDATE(),INTERVAL 1 DAY),'完了','北陸重工(株)','',DATE_SUB(NOW(),INTERVAL 17 DAY)),
 ('SJ-2608-0004','PMP-1001','L-01',80,42,4,DATE_SUB(CURDATE(),INTERVAL 1 DAY),'作業中','東海水道機工(株)','納期遅れ 客先連絡済',DATE_SUB(NOW(),INTERVAL 15 DAY)),
 ('SJ-2608-0005','BLW-5500','L-04',60,18,0,DATE_ADD(CURDATE(),INTERVAL 5 DAY),'作業中','関西空調設備','塗装色 特注',DATE_SUB(NOW(),INTERVAL 12 DAY)),
 ('SJ-2608-0006','MSL-4400','L-03',400,400,12,DATE_SUB(CURDATE(),INTERVAL 6 DAY),'完了','東海水道機工(株)','',DATE_SUB(NOW(),INTERVAL 12 DAY)),
 ('SJ-2608-0007','BRG-6600','L-01',240,96,2,DATE_ADD(CURDATE(),INTERVAL 1 DAY),'作業中','九州ポンプ商会','',DATE_SUB(NOW(),INTERVAL 10 DAY)),
 ('SJ-2608-0008','IMP-2200','L-02',180,0,0,DATE_ADD(CURDATE(),INTERVAL 8 DAY),'未着手','中部プラント工業','',DATE_SUB(NOW(),INTERVAL 8 DAY)),
 ('SJ-2608-0009','PMP-1000','L-01',100,55,9,DATE_SUB(CURDATE(),INTERVAL 2 DAY),'保留','四国上下水道','寸法不良多発 原因調査中',DATE_SUB(NOW(),INTERVAL 7 DAY)),
 ('SJ-2608-0010','SFT-3300','L-02',300,120,1,DATE_ADD(CURDATE(),INTERVAL 3 DAY),'作業中','北陸重工(株)','',DATE_SUB(NOW(),INTERVAL 6 DAY)),
 ('SJ-2608-0011','BLW-5500','L-04',40,0,0,DATE_ADD(CURDATE(),INTERVAL 12 DAY),'未着手','関西空調設備','',DATE_SUB(NOW(),INTERVAL 5 DAY)),
 ('SJ-2608-0012','MSL-4400','L-03',500,210,5,DATE_ADD(CURDATE(),INTERVAL 4 DAY),'作業中','東海水道機工(株)','',DATE_SUB(NOW(),INTERVAL 4 DAY)),
 ('SJ-2608-0013','PMP-1001','L-01',90,0,0,DATE_ADD(CURDATE(),INTERVAL 15 DAY),'未着手','九州ポンプ商会','',DATE_SUB(NOW(),INTERVAL 3 DAY)),
 ('SJ-2608-0014','BRG-6600','L-01',160,64,0,DATE_ADD(CURDATE(),INTERVAL 6 DAY),'作業中','中部プラント工業','',DATE_SUB(NOW(),INTERVAL 2 DAY));

INSERT INTO t_kotei_jisseki (shiji_no,kotei_no,kotei_nm,setsubi_cd,sagyousha,kaishi_dt,shuryo_dt,yoryo_suryo,furyo_suryo) VALUES
 ('SJ-2608-0002',1,'鋳造',NULL,'田中 一郎',DATE_SUB(NOW(),INTERVAL 6 DAY),DATE_SUB(NOW(),INTERVAL 6 DAY),200,0),
 ('SJ-2608-0002',2,'機械加工','LT-201','鈴木 次郎',DATE_SUB(NOW(),INTERVAL 5 DAY),DATE_SUB(NOW(),INTERVAL 4 DAY),192,8),
 ('SJ-2608-0002',3,'組立','AS-301','佐藤 三郎',DATE_SUB(NOW(),INTERVAL 3 DAY),DATE_SUB(NOW(),INTERVAL 2 DAY),176,6),
 ('SJ-2608-0002',4,'検査','CM-501','高橋 花子',DATE_SUB(NOW(),INTERVAL 1 DAY),NULL,168,6),
 ('SJ-2608-0004',1,'鋳造',NULL,'田中 一郎',DATE_SUB(NOW(),INTERVAL 8 DAY),DATE_SUB(NOW(),INTERVAL 7 DAY),80,0),
 ('SJ-2608-0004',2,'機械加工','MC-101','伊藤 四郎',DATE_SUB(NOW(),INTERVAL 6 DAY),NULL,42,4),
 ('SJ-2608-0005',1,'機械加工','MC-102','渡辺 五郎',DATE_SUB(NOW(),INTERVAL 4 DAY),DATE_SUB(NOW(),INTERVAL 3 DAY),60,0),
 ('SJ-2608-0005',2,'塗装','PT-401','山本 六郎',DATE_SUB(NOW(),INTERVAL 2 DAY),NULL,18,0),
 ('SJ-2608-0007',2,'機械加工','MC-101','伊藤 四郎',DATE_SUB(NOW(),INTERVAL 3 DAY),NULL,96,2),
 ('SJ-2608-0009',2,'機械加工','MC-101','中村 七郎',DATE_SUB(NOW(),INTERVAL 5 DAY),NULL,55,9),
 ('SJ-2608-0010',2,'機械加工','LT-202','鈴木 次郎',DATE_SUB(NOW(),INTERVAL 2 DAY),NULL,120,1),
 ('SJ-2608-0012',3,'組立','AS-301','佐藤 三郎',DATE_SUB(NOW(),INTERVAL 2 DAY),NULL,210,5),
 ('SJ-2608-0014',2,'機械加工','LT-201','小林 八郎',DATE_SUB(NOW(),INTERVAL 1 DAY),NULL,64,0);

INSERT INTO t_kensa (shiji_no,lot_no,kensa_ymd,kensa_sha,sunpou,kijun_min,kijun_max,hantei,furyo_naiyo) VALUES
 ('SJ-2608-0002','LOT-A101',DATE_SUB(CURDATE(),INTERVAL 2 DAY),'高橋 花子',219.985,219.900,220.100,'OK',''),
 ('SJ-2608-0002','LOT-A102',DATE_SUB(CURDATE(),INTERVAL 2 DAY),'高橋 花子',220.140,219.900,220.100,'NG','外径寸法超過'),
 ('SJ-2608-0002','LOT-A103',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'高橋 花子',220.010,219.900,220.100,'OK',''),
 ('SJ-2608-0004','LOT-B201',DATE_SUB(CURDATE(),INTERVAL 3 DAY),'松本 良子',150.320,150.000,150.500,'OK',''),
 ('SJ-2608-0004','LOT-B202',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'松本 良子',150.620,150.000,150.500,'NG','フランジ内径 公差外'),
 ('SJ-2608-0007','LOT-C301',DATE_SUB(CURDATE(),INTERVAL 2 DAY),'高橋 花子',45.020,44.950,45.050,'OK',''),
 ('SJ-2608-0009','LOT-D401',DATE_SUB(CURDATE(),INTERVAL 4 DAY),'松本 良子',100.780,100.000,100.500,'NG','肉厚不足 鋳造起因'),
 ('SJ-2608-0009','LOT-D402',DATE_SUB(CURDATE(),INTERVAL 3 DAY),'松本 良子',100.610,100.000,100.500,'NG','肉厚不足 鋳造起因'),
 ('SJ-2608-0009','LOT-D403',DATE_SUB(CURDATE(),INTERVAL 2 DAY),'高橋 花子',100.310,100.000,100.500,'再検査','要 三次元測定'),
 ('SJ-2608-0010','LOT-E501',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'高橋 花子',44.980,44.950,45.050,'OK',''),
 ('SJ-2608-0012','LOT-F601',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'松本 良子',45.030,44.950,45.050,'OK',''),
 ('SJ-2608-0012','LOT-F602',CURDATE(),'松本 良子',45.070,44.950,45.050,'NG','シール面 粗度不良');

INSERT INTO t_hozen (setsubi_cd,shubetsu,hassei_ymd,fukyu_ymd,teishi_jikan,naiyo,tantou) VALUES
 ('MC-101','故障修理',DATE_SUB(CURDATE(),INTERVAL 5 DAY),DATE_SUB(CURDATE(),INTERVAL 5 DAY),3.50,'主軸アラーム発生 ベアリング交換','保全 大野'),
 ('LT-201','定期点検',DATE_SUB(CURDATE(),INTERVAL 12 DAY),DATE_SUB(CURDATE(),INTERVAL 12 DAY),1.00,'月次点検 異常なし','保全 大野'),
 ('AS-301','部品交換',DATE_SUB(CURDATE(),INTERVAL 9 DAY),DATE_SUB(CURDATE(),INTERVAL 8 DAY),9.00,'コンベアベルト摩耗 交換','保全 川口'),
 ('PT-401','故障修理',DATE_SUB(CURDATE(),INTERVAL 2 DAY),NULL,0.00,'塗装ポンプ圧力低下 部品手配中','保全 川口'),
 ('MC-102','定期点検',DATE_SUB(CURDATE(),INTERVAL 31 DAY),DATE_SUB(CURDATE(),INTERVAL 31 DAY),1.50,'月次点検 クーラント補充','保全 大野'),
 ('CM-501','定期点検',DATE_SUB(CURDATE(),INTERVAL 200 DAY),DATE_SUB(CURDATE(),INTERVAL 200 DAY),4.00,'校正実施 (外部委託)','品質 高橋'),
 ('LT-202','故障修理',DATE_SUB(CURDATE(),INTERVAL 1 DAY),NULL,0.00,'チャック油圧漏れ 修理中','保全 大野');

INSERT INTO t_zaiko (buhin_cd,buhin_nm,souko_cd,zaiko_su,anzen_zaiko,hacchu_ten,shiire_nm,tanka) VALUES
 ('BLT-M12','六角ボルト M12x40','W-01',1240,400,600,'名古屋鋼機商事',38.00),
 ('BLT-M16','六角ボルト M16x60','W-01',180,300,450,'名古屋鋼機商事',72.00),
 ('GSK-100','ガスケット 100A','W-01',95,120,180,'東海シール工業',540.00),
 ('GSK-150','ガスケット 150A','W-01',310,120,180,'東海シール工業',820.00),
 ('BRG-6205','転がり軸受 6205','W-02',64,80,120,'日本ベアリング販売',1250.00),
 ('BRG-6308','転がり軸受 6308','W-02',210,80,120,'日本ベアリング販売',2980.00),
 ('SEL-45A','メカニカルシール部品 45A','W-02',22,40,60,'中部シール',6400.00),
 ('PNT-BL','塗料 ブルー (20kg)','W-03',6,8,12,'旭塗料',18500.00),
 ('PNT-GY','塗料 グレー (20kg)','W-03',14,8,12,'旭塗料',17200.00),
 ('CST-1000','鋳物素材 PMP-1000用','W-04',48,60,90,'岐阜鋳造所',12800.00),
 ('CST-1001','鋳物素材 PMP-1001用','W-04',72,60,90,'岐阜鋳造所',16400.00),
 ('STK-S45C','丸棒 S45C φ50','W-04',130,100,150,'名古屋鋼機商事',3200.00);
