<!--- 製造指示 詳細。1画面で5本クエリを投げている --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.shiji_no" default="">

<cfquery name="qShiji" datasource="mesdb">
	select s.*, h.hinmoku_nm, h.kikaku, h.tani, h.hyojun_jikan
	from t_seizou_shiji s, m_hinmoku h
	where s.hinmoku_cd = h.hinmoku_cd
	  and s.shiji_no = '#url.shiji_no#'
</cfquery>

<cfif qShiji.recordCount EQ 0>
	<cfoutput><div class="box">指示番号 #encodeForHTML(url.shiji_no)# は登録されていません。</div></cfoutput>
	<cfinclude template="inc/footer.cfm">
	<cfabort>
</cfif>

<cfquery name="qKotei" datasource="mesdb">
	select j.*, m.setsubi_nm
	from t_kotei_jisseki j left join m_setsubi m on j.setsubi_cd = m.setsubi_cd
	where j.shiji_no = '#url.shiji_no#'
	order by j.kotei_no
</cfquery>

<cfquery name="qKensa" datasource="mesdb">
	select * from t_kensa where shiji_no = '#url.shiji_no#' order by kensa_ymd desc, kensa_id desc
</cfquery>

<cfset zan  = qShiji.suryo - qShiji.kanryo_suryo>
<cfset rate = qShiji.suryo GT 0 ? int((qShiji.kanryo_suryo / qShiji.suryo) * 100) : 0>
<!--- 所要工数の計算。単位が分なのかコメントもなく、他画面では時間で扱っている --->
<cfset yotei_kosu = qShiji.suryo * qShiji.hyojun_jikan>

<cfoutput>
<h1>製造指示 詳細&nbsp;&nbsp;#qShiji.shiji_no#</h1>

<table border="0" cellpadding="0" cellspacing="8" width="100%">
<tr valign="top">
<td width="55%">
	<table class="grid" width="100%">
		<tr><th width="130">指示番号</th><td>#qShiji.shiji_no#</td><th width="130">状態</th><td>#qShiji.status#</td></tr>
		<tr><th>品目コード</th><td>#qShiji.hinmoku_cd#</td><th>ライン</th><td>#qShiji.line_cd#</td></tr>
		<tr><th>品目名</th><td colspan="3">#qShiji.hinmoku_nm#</td></tr>
		<tr><th>規格</th><td colspan="3">#qShiji.kikaku#</td></tr>
		<tr><th>得意先</th><td colspan="3">#qShiji.tokui_nm#</td></tr>
		<tr><th>指示数</th><td>#numberFormat(qShiji.suryo,",")# #qShiji.tani#</td><th>納期</th><td>#dateFormat(qShiji.noki_ymd,"yyyy/mm/dd")#</td></tr>
		<tr><th>完了数</th><td>#numberFormat(qShiji.kanryo_suryo,",")# #qShiji.tani#</td><th>残数</th><td>#numberFormat(zan,",")# #qShiji.tani#</td></tr>
		<tr><th>不良数</th><td><cfif qShiji.furyo_suryo GT 0><span class="ng">#qShiji.furyo_suryo#</span><cfelse>0</cfif></td><th>進捗率</th><td><span class="barBg"><span class="bar" style="width:#rate#px;"></span></span>&nbsp;#rate#%</td></tr>
		<tr><th>標準工数</th><td>#numberFormat(qShiji.hyojun_jikan,"9.99")# 分/個</td><th>予定工数</th><td>#numberFormat(yotei_kosu,",")# 分</td></tr>
		<tr><th>登録日時</th><td>#dateFormat(qShiji.toroku_ymd,"yyyy/mm/dd")# #timeFormat(qShiji.toroku_ymd,"HH:mm")#</td><th>備考</th><td>#qShiji.bikou#</td></tr>
	</table>

	<h2>■ 工程実績</h2>
	<table class="grid" width="100%">
		<tr><th>工程</th><th>工程名</th><th>設備</th><th>作業者</th><th>開始</th><th>終了</th><th>良品数</th><th>不良数</th></tr>
		<cfloop query="qKotei">
			<tr<cfif qKotei.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td class="num">#qKotei.kotei_no#</td>
				<td>#qKotei.kotei_nm#</td>
				<td>#qKotei.setsubi_cd#<cfif len(qKotei.setsubi_nm)> #qKotei.setsubi_nm#</cfif></td>
				<td>#qKotei.sagyousha#</td>
				<td>#dateFormat(qKotei.kaishi_dt,"mm/dd")# #timeFormat(qKotei.kaishi_dt,"HH:mm")#</td>
				<td><cfif isDate(qKotei.shuryo_dt)>#dateFormat(qKotei.shuryo_dt,"mm/dd")# #timeFormat(qKotei.shuryo_dt,"HH:mm")#<cfelse><span class="ng">作業中</span></cfif></td>
				<td class="num">#qKotei.yoryo_suryo#</td>
				<td class="num"><cfif qKotei.furyo_suryo GT 0><span class="ng">#qKotei.furyo_suryo#</span><cfelse>0</cfif></td>
			</tr>
		</cfloop>
		<cfif qKotei.recordCount EQ 0><tr><td colspan="8">工程実績は未登録です。</td></tr></cfif>
	</table>
	<p><a href="progress.cfm?shiji_no=#qShiji.shiji_no#">▶ この指示の実績を入力する</a></p>
</td>
<td width="45%">
	<h2>■ 検査結果</h2>
	<table class="grid" width="100%">
		<tr><th>ロット</th><th>検査日</th><th>検査者</th><th>測定値</th><th>規格</th><th>判定</th><th>不良内容</th></tr>
		<cfloop query="qKensa">
			<tr<cfif qKensa.hantei EQ "NG"> class="late"<cfelseif qKensa.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qKensa.lot_no#</td>
				<td>#dateFormat(qKensa.kensa_ymd,"mm/dd")#</td>
				<td>#qKensa.kensa_sha#</td>
				<td class="num">#numberFormat(qKensa.sunpou,"9.999")#</td>
				<td class="num">#numberFormat(qKensa.kijun_min,"9.999")# - #numberFormat(qKensa.kijun_max,"9.999")#</td>
				<td><cfif qKensa.hantei EQ "OK"><span class="ok">OK</span><cfelse><span class="ng">#qKensa.hantei#</span></cfif></td>
				<td>#qKensa.furyo_naiyo#</td>
			</tr>
		</cfloop>
		<cfif qKensa.recordCount EQ 0><tr><td colspan="7">検査結果は未登録です。</td></tr></cfif>
	</table>
	<p><a href="inspection.cfm?shiji_no=#qShiji.shiji_no#">▶ 検査結果を入力する</a></p>

	<div class="box" style="margin-top:14px;">
		<b>※ 画面仕様書 (1998年版) より</b><br>
		本画面の進捗率は「完了数 ÷ 指示数」で算出する。<br>
		不良数は工程実績の合計と一致しない場合がある (検査での不良を含まないため)。
	</div>
</td>
</tr>
</table>

<p><a href="orders.cfm">&lt;&lt; 一覧へ戻る</a></p>
</cfoutput>

<cfinclude template="inc/footer.cfm">
