SET NAMES utf8mb4;
-- 生産管理システム (SEIZO-MES) スキーマ
-- 1998年初版。以降、列の追加のみで運用されている (削除は「怖いので」しない)

CREATE TABLE m_hinmoku (
  hinmoku_cd   VARCHAR(20)  NOT NULL,
  hinmoku_nm   VARCHAR(120) NOT NULL,
  kikaku       VARCHAR(60),
  tani         VARCHAR(10),
  hyojun_jikan DECIMAL(8,2),        -- 標準工数(分/個)
  del_flg      CHAR(1) DEFAULT '0', -- 論理削除。物理削除はしない運用
  PRIMARY KEY (hinmoku_cd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE m_setsubi (
  setsubi_cd   VARCHAR(20)  NOT NULL,
  setsubi_nm   VARCHAR(120) NOT NULL,
  line_cd      VARCHAR(10),
  maker        VARCHAR(60),
  dounyu_ymd   DATE,
  tenken_cycle INT,                 -- 点検周期(日)
  PRIMARY KEY (setsubi_cd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_seizou_shiji (
  shiji_no     VARCHAR(20)  NOT NULL,   -- 製造指示番号
  hinmoku_cd   VARCHAR(20)  NOT NULL,
  line_cd      VARCHAR(10),
  suryo        INT          NOT NULL,   -- 指示数
  kanryo_suryo INT DEFAULT 0,           -- 完了数
  furyo_suryo  INT DEFAULT 0,           -- 不良数
  noki_ymd     DATE,                    -- 納期
  status       VARCHAR(10),             -- 未着手/作業中/完了/保留
  tokui_nm     VARCHAR(120),            -- 得意先名 (マスタ化されていない)
  bikou        VARCHAR(255),
  toroku_ymd   DATETIME,
  PRIMARY KEY (shiji_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_kotei_jisseki (
  jisseki_id   INT AUTO_INCREMENT,
  shiji_no     VARCHAR(20)  NOT NULL,
  kotei_no     INT          NOT NULL,   -- 工程順
  kotei_nm     VARCHAR(60),             -- 鋳造/機械加工/組立/塗装/検査
  setsubi_cd   VARCHAR(20),
  sagyousha    VARCHAR(60),             -- 氏名を直接保持
  kaishi_dt    DATETIME,
  shuryo_dt    DATETIME,
  yoryo_suryo  INT,                     -- 良品数
  furyo_suryo  INT,
  PRIMARY KEY (jisseki_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_kensa (
  kensa_id     INT AUTO_INCREMENT,
  shiji_no     VARCHAR(20)  NOT NULL,
  lot_no       VARCHAR(30),
  kensa_ymd    DATE,
  kensa_sha    VARCHAR(60),
  sunpou       DECIMAL(8,3),            -- 測定値(mm)
  kijun_min    DECIMAL(8,3),
  kijun_max    DECIMAL(8,3),
  hantei       VARCHAR(10),             -- OK/NG/再検査
  furyo_naiyo  VARCHAR(255),
  PRIMARY KEY (kensa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_hozen (
  hozen_id     INT AUTO_INCREMENT,
  setsubi_cd   VARCHAR(20)  NOT NULL,
  shubetsu     VARCHAR(20),             -- 定期点検/故障修理/部品交換
  hassei_ymd   DATE,
  fukyu_ymd    DATE,                    -- 復旧日
  teishi_jikan DECIMAL(8,2),            -- 停止時間(時間)
  naiyo        VARCHAR(255),
  tantou       VARCHAR(60),
  PRIMARY KEY (hozen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_zaiko (
  buhin_cd     VARCHAR(20)  NOT NULL,
  buhin_nm     VARCHAR(120) NOT NULL,
  souko_cd     VARCHAR(10),
  zaiko_su     INT DEFAULT 0,
  anzen_zaiko  INT DEFAULT 0,           -- 安全在庫
  hacchu_ten   INT DEFAULT 0,           -- 発注点
  shiire_nm    VARCHAR(120),
  tanka        DECIMAL(10,2),
  PRIMARY KEY (buhin_cd, souko_cd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
