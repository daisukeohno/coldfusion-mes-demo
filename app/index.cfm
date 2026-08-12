<!--- ダッシュボード。集計は全部この画面のSQLでやっている --->
<cfinclude template="inc/header.cfm">

<cfquery name="qShiji" datasource="mesdb">
	select status, count(*) as ken, sum(suryo) as suryo, sum(kanryo_suryo) as kanryo, sum(furyo_suryo) as furyo
	from t_seizou_shiji
	group by status
	order by status
</cfquery>

<cfquery name="qLine" datasource="mesdb">
	select line_cd, sum(suryo) as suryo, sum(kanryo_suryo) as kanryo, sum(furyo_suryo) as furyo
	from t_seizou_shiji
	where status <> '完了'
	group by line_cd
	order by line_cd
</cfquery>

<!--- 納期遅れの判定ロジックが画面ごとにコピーされている (orders.cfm と report.cfm にも同じ条件がある) --->
<cfquery name="qOkure" datasource="mesdb">
	select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo, s.kanryo_suryo, s.noki_ymd, s.tokui_nm
	from t_seizou_shiji s, m_hinmoku h
	where s.hinmoku_cd = h.hinmoku_cd
	  and s.status <> '完了'
	  and s.noki_ymd < curdate()
	order by s.noki_ymd
</cfquery>

<cfquery name="qKensa" datasource="mesdb">
	select hantei, count(*) as ken from t_kensa group by hantei
</cfquery>

<cfquery name="qHozen" datasource="mesdb">
	select z.setsubi_cd, m.setsubi_nm, z.shubetsu, z.hassei_ymd, z.naiyo
	from t_hozen z, m_setsubi m
	where z.setsubi_cd = m.setsubi_cd
	  and z.fukyu_ymd is null
	order by z.hassei_ymd
</cfquery>

<cfquery name="qZaiko" datasource="mesdb">
	select buhin_cd, buhin_nm, souko_cd, zaiko_su, hacchu_ten
	from t_zaiko
	where zaiko_su < hacchu_ten
	order by (zaiko_su - hacchu_ten)
</cfquery>

<cfset totalSuryo = 0><cfset totalKanryo = 0><cfset totalFuryo = 0><cfset totalKen = 0>
<cfloop query="qShiji">
	<cfset totalKen = totalKen + qShiji.ken>
	<cfset totalSuryo = totalSuryo + qShiji.suryo>
	<cfset totalKanryo = totalKanryo + qShiji.kanryo>
	<cfset totalFuryo = totalFuryo + qShiji.furyo>
</cfloop>
<!--- 不良率の計算式が画面ごとに微妙に違う (report.cfm では完了数で割っている) --->
<cfset furyoRate = totalSuryo GT 0 ? (totalFuryo / totalSuryo) * 100 : 0>

<cfoutput>
<h1>生産管理ダッシュボード&nbsp;&nbsp;<span style="font-weight:normal;font-size:11px;">#dateFormat(now(),"yyyy年mm月dd日")# 現在</span></h1>

<table border="0" cellpadding="0" cellspacing="6" width="100%">
	<tr valign="top">
		<td width="20%"><div class="kpi"><div class="v">#totalKen#</div><div class="l">製造指示 件数</div></div></td>
		<td width="20%"><div class="kpi"><div class="v">#numberFormat(totalSuryo,",")#</div><div class="l">指示数 合計</div></div></td>
		<td width="20%"><div class="kpi"><div class="v">#numberFormat(totalKanryo,",")#</div><div class="l">完了数 合計</div></div></td>
		<td width="20%"><div class="kpi"><div class="v" style="color:##cc0000;">#numberFormat(furyoRate,"9.99")#%</div><div class="l">不良率 (指示数ベース)</div></div></td>
		<td width="20%"><div class="kpi"><div class="v" style="color:##cc0000;">#qOkure.recordCount#</div><div class="l">納期遅れ 件数</div></div></td>
	</tr>
</table>

<table border="0" cellpadding="0" cellspacing="8" width="100%">
<tr valign="top">
<td width="50%">

	<h2>■ 状態別 集計</h2>
	<table class="grid" width="100%">
		<tr><th>状態</th><th>件数</th><th>指示数</th><th>完了数</th><th>不良数</th><th>進捗</th></tr>
		<cfloop query="qShiji">
			<cfset rate = qShiji.suryo GT 0 ? int((qShiji.kanryo / qShiji.suryo) * 100) : 0>
			<tr<cfif qShiji.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qShiji.status#</td>
				<td class="num">#qShiji.ken#</td>
				<td class="num">#numberFormat(qShiji.suryo,",")#</td>
				<td class="num">#numberFormat(qShiji.kanryo,",")#</td>
				<td class="num"><cfif qShiji.furyo GT 0><span class="ng">#qShiji.furyo#</span><cfelse>0</cfif></td>
				<td><span class="barBg"><span class="bar" style="width:#rate#px;"></span></span>&nbsp;#rate#%</td>
			</tr>
		</cfloop>
	</table>

	<h2>■ ライン別 進捗 (未完了分)</h2>
	<table class="grid" width="100%">
		<tr><th>ライン</th><th>指示数</th><th>完了数</th><th>残数</th><th>不良数</th></tr>
		<cfloop query="qLine">
			<tr<cfif qLine.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qLine.line_cd#</td>
				<td class="num">#numberFormat(qLine.suryo,",")#</td>
				<td class="num">#numberFormat(qLine.kanryo,",")#</td>
				<td class="num">#numberFormat(qLine.suryo - qLine.kanryo,",")#</td>
				<td class="num">#qLine.furyo#</td>
			</tr>
		</cfloop>
	</table>

	<h2>■ 検査判定 集計</h2>
	<table class="grid" width="100%">
		<tr><th>判定</th><th>件数</th></tr>
		<cfloop query="qKensa">
			<tr><td><cfif qKensa.hantei EQ "NG"><span class="ng">#qKensa.hantei#</span><cfelse>#qKensa.hantei#</cfif></td><td class="num">#qKensa.ken#</td></tr>
		</cfloop>
	</table>

</td>
<td width="50%">

	<h2>■ 納期遅れ 一覧</h2>
	<table class="grid" width="100%">
		<tr><th>指示番号</th><th>品目</th><th>ライン</th><th>指示/完了</th><th>納期</th><th>得意先</th></tr>
		<cfloop query="qOkure">
			<tr class="late">
				<td><a href="order_detail.cfm?shiji_no=#qOkure.shiji_no#">#qOkure.shiji_no#</a></td>
				<td>#qOkure.hinmoku_nm#</td>
				<td>#qOkure.line_cd#</td>
				<td class="num">#qOkure.suryo# / #qOkure.kanryo_suryo#</td>
				<td>#dateFormat(qOkure.noki_ymd,"yyyy/mm/dd")#</td>
				<td>#qOkure.tokui_nm#</td>
			</tr>
		</cfloop>
		<cfif qOkure.recordCount EQ 0><tr><td colspan="6">該当データなし</td></tr></cfif>
	</table>

	<h2>■ 設備 未復旧 一覧</h2>
	<table class="grid" width="100%">
		<tr><th>設備</th><th>種別</th><th>発生日</th><th>内容</th></tr>
		<cfloop query="qHozen">
			<tr class="warn">
				<td>#qHozen.setsubi_cd# #qHozen.setsubi_nm#</td>
				<td>#qHozen.shubetsu#</td>
				<td>#dateFormat(qHozen.hassei_ymd,"yyyy/mm/dd")#</td>
				<td>#qHozen.naiyo#</td>
			</tr>
		</cfloop>
		<cfif qHozen.recordCount EQ 0><tr><td colspan="4">該当データなし</td></tr></cfif>
	</table>

	<h2>■ 発注点割れ 部品</h2>
	<table class="grid" width="100%">
		<tr><th>部品</th><th>倉庫</th><th>在庫数</th><th>発注点</th><th>不足</th></tr>
		<cfloop query="qZaiko">
			<tr class="warn">
				<td>#qZaiko.buhin_cd# #qZaiko.buhin_nm#</td>
				<td>#qZaiko.souko_cd#</td>
				<td class="num">#qZaiko.zaiko_su#</td>
				<td class="num">#qZaiko.hacchu_ten#</td>
				<td class="num"><span class="ng">#qZaiko.hacchu_ten - qZaiko.zaiko_su#</span></td>
			</tr>
		</cfloop>
	</table>

</td>
</tr>
</table>
</cfoutput>

<cfinclude template="inc/footer.cfm">
