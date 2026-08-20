delete from t_kensa;
delete from t_seizou_shiji;
delete from m_hinmoku;

insert into m_hinmoku (hinmoku_cd, hinmoku_nm, kikaku, tani, hyojun_jikan)
values ('HM-001', 'フレームA', 'SS400', '個', 12.5),
       ('HM-002', 'カバーB', 'SUS304', '個', 8.0);

insert into t_seizou_shiji (shiji_no, hinmoku_cd, line_cd, suryo, status)
values ('SJ-0001', 'HM-001', 'L1', 100, '作業中'),
       ('SJ-0002', 'HM-002', 'L2', 50, '未着手');
