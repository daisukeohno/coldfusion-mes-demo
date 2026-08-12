<!--- 設備保全。次回点検日の計算がこの画面のロジックにしかない --->
<cfinclude template="inc/header.cfm">

<cfparam name="form.mode" default="">
<cfset msg = "">

<cfif form.mode EQ "regist">
	<cfquery datasource="mesdb">
		insert into t_hozen (setsubi_cd, shubetsu, hassei_ymd, fukyu_ymd, teishi_jikan, naiyo, tantou)
		values (
			  <cfqueryparam value="#form.setsubi_cd#" cfsqltype="cf_sql_varchar">
			, <cfqueryparam value="#form.shubetsu#" cfsqltype="cf_sql_varchar">
			, curdate()
			, <cfif form.fukyu EQ "1">curdate()<cfelse>null</cfif>
			, <cfqueryparam value="#isNumeric(form.teishi_jikan) ? form.teishi_jikan : 0#" cfsqltype="cf_sql_decimal" scale="2">
			, <cfqueryparam value="#form.naiyo#" cfsqltype="cf_sql_varchar">
			, <cfqueryparam value="#form.tantou#" cfsqltype="cf_sql_varchar">
		)
	</cfquery>
	<cfset msg = "保全記録を登録しました。">
</cfif>

<cfquery name="qSetsubi" datasource="mesdb">
	select setsubi_cd, setsubi_nm, line_cd, maker, dounyu_ymd, tenken_cycle from m_setsubi order by line_cd, setsubi_cd
</cfquery>

<!--- 設備ごとの最終点検日を1本のSQLで取れず、画面側でループしてクエリを投げている (N+1) --->
<cfquery name="qHozenAll" datasource="mesdb">
	select z.*, m.setsubi_nm, m.line_cd, m.tenken_cycle
	from t_hozen z, m_setsubi m
	where z.setsubi_cd = m.setsubi_cd
	order by z.hassei_ymd desc
</cfquery>

<cfquery name="qTeishi" datasource="mesdb">
	select z.setsubi_cd, m.setsubi_nm, sum(z.teishi_jikan) as jikan, count(*) as ken
	from t_hozen z, m_setsubi m
	where z.setsubi_cd = m.setsubi_cd
	group by z.setsubi_cd, m.setsubi_nm
	order by jikan desc
</cfquery>

<cfoutput>
<h1>設備保全</h1>

<cfif len(msg)><div class="box"><b>#msg#</b></div></cfif>

<div class="box">
<form method="post" action="maintenance.cfm">
	<input type="hidden" name="mode" value="regist">
	<table border="0" cellpadding="4" cellspacing="0">
		<tr>
			<td width="70">設備</td>
			<td>
				<select name="setsubi_cd">
					<cfloop query="qSetsubi">
						<option value="#qSetsubi.setsubi_cd#">#qSetsubi.setsubi_cd# #qSetsubi.setsubi_nm# (#qSetsubi.line_cd#)</option>
					</cfloop>
				</select>
			</td>
			<td width="50">種別</td>
			<td>
				<select name="shubetsu">
					<cfloop list="定期点検,故障修理,部品交換" index="s"><option value="#s#">#s#</option></cfloop>
				</select>
			</td>
			<td width="80">停止時間(h)</td>
			<td><input type="text" name="teishi_jikan" value="0.0" size="6"></td>
			<td width="50">復旧</td>
			<td><select name="fukyu"><option value="0">未復旧</option><option value="1">復旧済</option></select></td>
		</tr>
		<tr>
			<td>内容</td>
			<td colspan="3"><input type="text" name="naiyo" value="" size="52"></td>
			<td>担当</td>
			<td><input type="text" name="tantou" value="保全 大野" size="10"></td>
			<td colspan="2"><input type="submit" value="　登　録　" class="btn"></td>
		</tr>
	</table>
</form>
</div>

<h2>■ 設備一覧 / 次回点検予定</h2>
<table class="grid" width="100%">
	<tr><th>設備コード</th><th>設備名</th><th>ライン</th><th>メーカ</th><th>導入日</th><th>経過年数</th><th>点検周期</th><th>最終点検日</th><th>次回点検予定</th><th>状態</th></tr>
	<cfloop query="qSetsubi">
		<!--- 1件ずつクエリを投げる。設備が増えると一覧が重くなる --->
		<cfquery name="qLast" datasource="mesdb">
			select max(hassei_ymd) as last_ymd from t_hozen
			where setsubi_cd = '#qSetsubi.setsubi_cd#' and shubetsu = '定期点検'
		</cfquery>
		<cfquery name="qOpen" datasource="mesdb">
			select count(*) as ken from t_hozen
			where setsubi_cd = '#qSetsubi.setsubi_cd#' and fukyu_ymd is null
		</cfquery>
		<cfset keika = int(dateDiff("d", qSetsubi.dounyu_ymd, now()) / 365)>
		<cfif isDate(qLast.last_ymd)>
			<cfset nextYmd = dateAdd("d", qSetsubi.tenken_cycle, qLast.last_ymd)>
			<cfset okure = dateCompare(nextYmd, now(), "d") LT 0>
		<cfelse>
			<cfset nextYmd = "">
			<cfset okure = true>
		</cfif>
		<tr<cfif okure> class="late"<cfelseif qSetsubi.currentRow MOD 2 EQ 0> class="alt"</cfif>>
			<td>#qSetsubi.setsubi_cd#</td>
			<td>#qSetsubi.setsubi_nm#</td>
			<td>#qSetsubi.line_cd#</td>
			<td>#qSetsubi.maker#</td>
			<td>#dateFormat(qSetsubi.dounyu_ymd,"yyyy/mm/dd")#</td>
			<td class="num">#keika# 年</td>
			<td class="num">#qSetsubi.tenken_cycle# 日</td>
			<td><cfif isDate(qLast.last_ymd)>#dateFormat(qLast.last_ymd,"yyyy/mm/dd")#<cfelse>-</cfif></td>
			<td><cfif isDate(nextYmd)>#dateFormat(nextYmd,"yyyy/mm/dd")#<cfif okure> <span class="ng">期限超過</span></cfif><cfelse><span class="ng">記録なし</span></cfif></td>
			<td><cfif qOpen.ken GT 0><span class="ng">未復旧 #qOpen.ken# 件</span><cfelse><span class="ok">稼働</span></cfif></td>
		</tr>
	</cfloop>
</table>

<table border="0" cellpadding="0" cellspacing="8" width="100%">
<tr valign="top">
<td width="70%">
	<h2>■ 保全履歴</h2>
	<table class="grid" width="100%">
		<tr><th>保全ID</th><th>設備</th><th>ライン</th><th>種別</th><th>発生日</th><th>復旧日</th><th>停止時間</th><th>内容</th><th>担当</th></tr>
		<cfloop query="qHozenAll">
			<tr<cfif NOT isDate(qHozenAll.fukyu_ymd)> class="warn"<cfelseif qHozenAll.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td class="num">#qHozenAll.hozen_id#</td>
				<td>#qHozenAll.setsubi_cd# #qHozenAll.setsubi_nm#</td>
				<td>#qHozenAll.line_cd#</td>
				<td>#qHozenAll.shubetsu#</td>
				<td>#dateFormat(qHozenAll.hassei_ymd,"yyyy/mm/dd")#</td>
				<td><cfif isDate(qHozenAll.fukyu_ymd)>#dateFormat(qHozenAll.fukyu_ymd,"yyyy/mm/dd")#<cfelse><span class="ng">未復旧</span></cfif></td>
				<td class="num">#numberFormat(qHozenAll.teishi_jikan,"9.9")# h</td>
				<td>#qHozenAll.naiyo#</td>
				<td>#qHozenAll.tantou#</td>
			</tr>
		</cfloop>
	</table>
</td>
<td width="30%">
	<h2>■ 設備別 停止時間 累計</h2>
	<table class="grid" width="100%">
		<tr><th>設備</th><th>件数</th><th>停止時間</th></tr>
		<cfloop query="qTeishi">
			<tr<cfif qTeishi.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qTeishi.setsubi_cd# #qTeishi.setsubi_nm#</td>
				<td class="num">#qTeishi.ken#</td>
				<td class="num">#numberFormat(qTeishi.jikan,"9.9")# h</td>
			</tr>
		</cfloop>
	</table>
</td>
</tr>
</table>
</cfoutput>

<cfinclude template="inc/footer.cfm">
