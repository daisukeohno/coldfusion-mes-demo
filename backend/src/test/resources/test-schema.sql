-- db/01_schema.sql の検査画面で使用するテーブルのみを H2 (MySQL モード) 向けに再現
CREATE TABLE m_hinmoku (
  hinmoku_cd   VARCHAR(20)  NOT NULL,
  hinmoku_nm   VARCHAR(120) NOT NULL,
  kikaku       VARCHAR(60),
  tani         VARCHAR(10),
  hyojun_jikan DECIMAL(8,2),
  del_flg      CHAR(1) DEFAULT '0',
  PRIMARY KEY (hinmoku_cd)
);

CREATE TABLE t_seizou_shiji (
  shiji_no     VARCHAR(20)  NOT NULL,
  hinmoku_cd   VARCHAR(20)  NOT NULL,
  line_cd      VARCHAR(10),
  suryo        INT          NOT NULL,
  kanryo_suryo INT DEFAULT 0,
  furyo_suryo  INT DEFAULT 0,
  noki_ymd     DATE,
  status       VARCHAR(10),
  tokui_nm     VARCHAR(120),
  bikou        VARCHAR(255),
  toroku_ymd   DATETIME,
  PRIMARY KEY (shiji_no)
);

CREATE TABLE t_kensa (
  kensa_id     INT AUTO_INCREMENT,
  shiji_no     VARCHAR(20)  NOT NULL,
  lot_no       VARCHAR(30),
  kensa_ymd    DATE,
  kensa_sha    VARCHAR(60),
  sunpou       DECIMAL(8,3),
  kijun_min    DECIMAL(8,3),
  kijun_max    DECIMAL(8,3),
  hantei       VARCHAR(10),
  furyo_naiyo  VARCHAR(255),
  PRIMARY KEY (kensa_id)
);
