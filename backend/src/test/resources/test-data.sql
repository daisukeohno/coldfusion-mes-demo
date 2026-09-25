INSERT INTO m_hinmoku (hinmoku_cd, hinmoku_nm, kikaku, tani, hyojun_jikan) VALUES
  ('H-001', 'ポンプケーシング A', 'φ220', '個', 12.50),
  ('H-002', 'インペラ B', 'φ150', '個', 8.00);

INSERT INTO t_seizou_shiji (shiji_no, hinmoku_cd, line_cd, suryo, status) VALUES
  ('S-0001', 'H-001', 'L1', 100, '作業中'),
  ('S-0002', 'H-002', 'L2', 50, '作業中');

INSERT INTO t_kensa (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo) VALUES
  ('S-0001', 'LOT-0101-01', DATE '2024-01-01', '高橋 花子', 220.000, 219.900, 220.100, 'OK', ''),
  ('S-0001', 'LOT-0101-02', DATE '2024-01-01', '高橋 花子', 220.150, 219.900, 220.100, 'NG', '寸法過大'),
  ('S-0002', 'LOT-0102-01', DATE '2024-01-02', '佐藤 一郎', 220.095, 219.900, 220.100, '再検査', '上限ぎりぎり'),
  ('S-0002', 'LOT-0102-02', DATE '2024-01-02', '佐藤 一郎', 219.800, 219.900, 220.100, 'NG', '寸法過大'),
  ('S-0002', 'LOT-0102-03', DATE '2024-01-02', '佐藤 一郎', 219.850, 219.900, 220.100, 'NG', '');
