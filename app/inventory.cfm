<!--- 部品在庫。入出庫はこの画面から直接UPDATEしている (履歴テーブルなし) --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.souko" default="">
<cfparam name="form.mode" default="">
<cfset msg = "">

<cfif form.mode EQ "nyuko" OR form.mode EQ "shukko">
	<cfif NOT isNumeric(form.su) OR form.su LTE 0>
		<cfset msg = "NG:数量は1以上の数値で入力してください。">
	<cfelse>
		<!--- 在庫数を直接加減算。履歴が残らないため差異調査ができない --->
		<cfquery datasource="mesdb">
			update t_zaiko
			   set zaiko_su = zaiko_su <cfif form.mode EQ "nyuko">+<cfelse>-</cfif> <cfqueryparam value="#form.su#" cfsqltype="cf_sql_integer">
			 where buhin_cd = <cfqueryparam value="#listFirst(form.target,'|')#" cfsqltype="cf_sql_varchar">
			   and souko_cd = <cfqueryparam value="#listLast(form.target,'|')#" cfsqltype="cf_sql_varchar">
		</cfquery>
		<cfset msg = "OK:" & ( form.mode EQ "nyuko" ? "入庫" : "出庫" ) & "を登録しました。">
	</cfif>
</cfif>

<cfset where = "">
<cfif len(url.souko)><cfset where = " and souko_cd = '" & url.souko & "'"></cfif>

<cfquery name="qZaiko" datasource="mesdb">
	select * from t_zaiko where 1=1 #preserveSingleQuotes(where)# order by souko_cd, buhin_cd
</cfquery>

<cfquery name="qSouko" datasource="mesdb">
	select souko_cd, count(*) as ken, sum(zaiko_su * tanka) as kingaku from t_zaiko group by souko_cd order by souko_cd
</cfquery>

<cfset sumKingaku = 0>
<cfloop query="qSouko"><cfset sumKingaku = sumKingaku + qSouko.kingaku></cfloop>

<cfoutput>
<h1>部品在庫</h1>

<cfif len(msg)><div class="box"><b<cfif left(msg,2) NEQ "OK"> class="ng"</cfif>>#listRest(msg,":")#</b></div></cfif>

<table border="0" cellpadding="0" cellspacing="6" width="100%">
	<tr valign="top">
		<td width="25%"><div class="kpi"><div class="v">#qZaiko.recordCount#</div><div class="l">部品点数</div></div></td>
		<td width="25%"><div class="kpi"><div class="v">#numberFormat(sumKingaku,",")#</div><div class="l">在庫金額 合計 (円)</div></div></td>
		<td width="50%">
			<div class="box" style="margin:0;">
				倉庫絞込:&nbsp;<a href="inventory.cfm">すべて</a>
				<cfloop query="qSouko">&nbsp;|&nbsp;<a href="inventory.cfm?souko=#qSouko.souko_cd#">#qSouko.souko_cd# (#qSouko.ken#件)</a></cfloop>
			</div>
		</td>
	</tr>
</table>

<h2>■ 在庫一覧</h2>
<table class="grid" width="100%">
	<tr><th>部品コード</th><th>部品名</th><th>倉庫</th><th>在庫数</th><th>安全在庫</th><th>発注点</th><th>判定</th><th>単価</th><th>在庫金額</th><th>仕入先</th><th>入出庫</th></tr>
	<cfloop query="qZaiko">
		<!--- 判定の閾値がこの画面のロジックにしかない。帳票側では安全在庫で判定している --->
		<cfif qZaiko.zaiko_su LT qZaiko.anzen_zaiko>
			<cfset hantei = "欠品リスク"><cfset cls = "late">
		<cfelseif qZaiko.zaiko_su LT qZaiko.hacchu_ten>
			<cfset hantei = "発注点割れ"><cfset cls = "warn">
		<cfelse>
			<cfset hantei = "適正"><cfset cls = ( qZaiko.currentRow MOD 2 EQ 0 ? "alt" : "" )>
		</cfif>
		<tr<cfif len(cls)> class="#cls#"</cfif>>
			<td>#qZaiko.buhin_cd#</td>
			<td>#qZaiko.buhin_nm#</td>
			<td>#qZaiko.souko_cd#</td>
			<td class="num">#numberFormat(qZaiko.zaiko_su,",")#</td>
			<td class="num">#numberFormat(qZaiko.anzen_zaiko,",")#</td>
			<td class="num">#numberFormat(qZaiko.hacchu_ten,",")#</td>
			<td><cfif hantei EQ "適正"><span class="ok">適正</span><cfelse><span class="ng">#hantei#</span></cfif></td>
			<td class="num">#numberFormat(qZaiko.tanka,",")#</td>
			<td class="num">#numberFormat(qZaiko.zaiko_su * qZaiko.tanka,",")#</td>
			<td>#qZaiko.shiire_nm#</td>
			<td>
				<form method="post" action="inventory.cfm" style="margin:0;">
					<input type="hidden" name="target" value="#qZaiko.buhin_cd#|#qZaiko.souko_cd#">
					<input type="text" name="su" value="10" size="4">
					<input type="submit" name="mode" value="nyuko" class="btn" style="display:none;">
					<button type="submit" name="mode" value="nyuko" class="btn">入庫</button>
					<button type="submit" name="mode" value="shukko" class="btn">出庫</button>
				</form>
			</td>
		</tr>
	</cfloop>
</table>

<h2>■ 倉庫別 在庫金額</h2>
<table class="grid">
	<tr><th>倉庫</th><th>部品点数</th><th>在庫金額 (円)</th></tr>
	<cfloop query="qSouko">
		<tr<cfif qSouko.currentRow MOD 2 EQ 0> class="alt"</cfif>>
			<td>#qSouko.souko_cd#</td>
			<td class="num">#qSouko.ken#</td>
			<td class="num">#numberFormat(qSouko.kingaku,",")#</td>
		</tr>
	</cfloop>
</table>
<div style="font-size:11px;color:##606060;padding-top:6px;">
	※ 入出庫は在庫数を直接更新します。履歴テーブルがないため、棚卸差異の原因追跡はできません。
</div>
</cfoutput>

<cfinclude template="inc/footer.cfm">
