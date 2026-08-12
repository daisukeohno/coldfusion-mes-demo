<!--- 製造指示一覧。検索条件は文字列連結でSQLを組んでいる (SQLインジェクションの温床) --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.kw"     default="">
<cfparam name="url.status" default="">
<cfparam name="url.line"   default="">
<cfparam name="url.sort"   default="noki_ymd">

<cfset sql = "select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo, s.kanryo_suryo, s.furyo_suryo, s.noki_ymd, s.status, s.tokui_nm, s.bikou">
<cfset sql = sql & " from t_seizou_shiji s, m_hinmoku h where s.hinmoku_cd = h.hinmoku_cd">
<cfif len(trim(url.kw))>
	<cfset sql = sql & " and (s.shiji_no like '%" & url.kw & "%' or h.hinmoku_nm like '%" & url.kw & "%' or s.tokui_nm like '%" & url.kw & "%')">
</cfif>
<cfif len(url.status)>
	<cfset sql = sql & " and s.status = '" & url.status & "'">
</cfif>
<cfif len(url.line)>
	<cfset sql = sql & " and s.line_cd = '" & url.line & "'">
</cfif>
<cfset sql = sql & " order by s." & url.sort>

<cfquery name="qList" datasource="mesdb">
	#preserveSingleQuotes(sql)#
</cfquery>

<cfoutput>
<h1>製造指示 一覧</h1>

<div class="box">
<form method="get" action="orders.cfm">
	<table border="0" cellpadding="3" cellspacing="0">
		<tr>
			<td>キーワード</td>
			<td><input type="text" name="kw" value="#encodeForHTMLAttribute(url.kw)#" size="24"></td>
			<td>&nbsp;状態</td>
			<td>
				<select name="status">
					<option value="">(すべて)</option>
					<cfloop list="未着手,作業中,完了,保留" index="st">
						<option value="#st#"<cfif url.status EQ st> selected</cfif>>#st#</option>
					</cfloop>
				</select>
			</td>
			<td>&nbsp;ライン</td>
			<td>
				<select name="line">
					<option value="">(すべて)</option>
					<cfloop list="#application.LINE_LIST#" index="ln">
						<option value="#ln#"<cfif url.line EQ ln> selected</cfif>>#ln#</option>
					</cfloop>
				</select>
			</td>
			<td>&nbsp;<input type="submit" value="　検索　" class="btn"></td>
			<td>&nbsp;<input type="button" value="クリア" class="btn" onclick="location.href='orders.cfm';"></td>
		</tr>
	</table>
</form>
</div>

<table class="grid" width="100%">
	<tr>
		<th><a href="orders.cfm?sort=shiji_no" style="color:##ffffff;">指示番号</a></th>
		<th>品目コード</th>
		<th>品目名</th>
		<th>ライン</th>
		<th>指示数</th>
		<th>完了数</th>
		<th>不良数</th>
		<th>進捗率</th>
		<th><a href="orders.cfm?sort=noki_ymd" style="color:##ffffff;">納期</a></th>
		<th>状態</th>
		<th>得意先</th>
		<th>備考</th>
		<th>&nbsp;</th>
	</tr>
	<cfloop query="qList">
		<cfset okure = ( qList.status NEQ "完了" AND dateCompare(qList.noki_ymd, now(), "d") LT 0 )>
		<cfset rate  = qList.suryo GT 0 ? int((qList.kanryo_suryo / qList.suryo) * 100) : 0>
		<tr<cfif okure> class="late"<cfelseif qList.currentRow MOD 2 EQ 0> class="alt"</cfif>>
			<td><a href="order_detail.cfm?shiji_no=#qList.shiji_no#">#qList.shiji_no#</a></td>
			<td>#qList.hinmoku_cd#</td>
			<td>#qList.hinmoku_nm#</td>
			<td>#qList.line_cd#</td>
			<td class="num">#numberFormat(qList.suryo,",")#</td>
			<td class="num">#numberFormat(qList.kanryo_suryo,",")#</td>
			<td class="num"><cfif qList.furyo_suryo GT 0><span class="ng">#qList.furyo_suryo#</span><cfelse>0</cfif></td>
			<td><span class="barBg"><span class="bar" style="width:#rate#px;"></span></span>&nbsp;#rate#%</td>
			<td>#dateFormat(qList.noki_ymd,"yyyy/mm/dd")#<cfif okure> <span class="ng">遅</span></cfif></td>
			<td>#qList.status#</td>
			<td>#qList.tokui_nm#</td>
			<td>#qList.bikou#</td>
			<td><a href="progress.cfm?shiji_no=#qList.shiji_no#">実績入力</a></td>
		</tr>
	</cfloop>
</table>
<p>#qList.recordCount# 件</p>
</cfoutput>

<cfinclude template="inc/footer.cfm">
