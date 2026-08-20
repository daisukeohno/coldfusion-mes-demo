-- db/01_schema.sql の該当テーブルのみを H2 (MySQL互換モード) 用に写したもの。
-- 本番の MySQL スキーマは変更しない。
create table if not exists m_hinmoku (
  hinmoku_cd   varchar(20)  not null primary key,
  hinmoku_nm   varchar(120) not null,
  kikaku       varchar(60),
  tani         varchar(10),
  hyojun_jikan decimal(8,2),
  del_flg      char(1) default '0'
);

create table if not exists t_seizou_shiji (
  shiji_no     varchar(20) not null primary key,
  hinmoku_cd   varchar(20) not null,
  line_cd      varchar(10),
  suryo        int not null,
  kanryo_suryo int default 0,
  furyo_suryo  int default 0,
  noki_ymd     date,
  status       varchar(10),
  tokui_nm     varchar(120),
  bikou        varchar(255),
  toroku_ymd   datetime
);

create table if not exists t_kensa (
  kensa_id     int auto_increment primary key,
  shiji_no     varchar(20) not null,
  lot_no       varchar(30),
  kensa_ymd    date,
  kensa_sha    varchar(60),
  sunpou       decimal(8,3),
  kijun_min    decimal(8,3),
  kijun_max    decimal(8,3),
  hantei       varchar(10),
  furyo_naiyo  varchar(255)
);
