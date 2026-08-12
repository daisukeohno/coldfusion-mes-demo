<!--- 生産日報 (印刷用)。集計ロジックがダッシュボードと微妙に違う --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.ymd" default="#dateFormat(now(),'yyyy-mm-dd')#">

<cfquery name="qLine" datasource="mesdb">
	select s.line_cd
	     , count(*) as ken
	     , sum(s.suryo) as suryo
	     , sum(s.kanryo_suryo) as kanryo
	     , sum(s.furyo_suryo) as furyo
	from t_seizou_shiji s
	group by s.line_cd
	order by s.line_cd
</cfquery>

<cfquery name="qKotei" datasource="mesdb">
	select j.kotei_nm, count(*) as ken, sum(j.yoryo_suryo) as yoryo, sum(j.furyo_suryo) as furyo
	from t_kotei_jisseki j
	group by j.kotei_nm
	order by j.kotei_nm
</cfquery>

<cfquery name="qSagyou" datasource="mesdb">
	select j.sagyousha, count(*) as ken, sum(j.yoryo_suryo) as yoryo, sum(j.furyo_suryo) as furyo
	from t_kotei_jisseki j
	group by j.sagyousha
	order by yoryo desc
</cfquery>

<cfquery name="qOkure" datasource="mesdb">
	select s.shiji_no, h.hinmoku_nm, s.noki_ymd, s.suryo, s.kanryo_suryo, s.tokui_nm
	from t_seizou_shiji s, m_hinmoku h
	where s.hinmoku_cd = h.hinmoku_cd and s.status <> '完了' and s.noki_ymd < curdate()
	order by s.noki_ymd
</cfquery>

<cfoutput>
<h1>生産日報 (印刷用)&nbsp;&nbsp;<span style="font-weight:normal;font-size:11px;">出力日 #dateFormat(now(),"yyyy年mm月dd日")#</span></h1>

<div class="box">
	<form method="get" action="report.cfm">
		対象日 <input type="text" name="ymd" value="#encodeForHTMLAttribute(url.ymd)#" size="12">
		<input type="submit" value="　表示　" class="btn">
		&nbsp;<input type="button" value="印刷" class="btn" onclick="window.print();">
		&nbsp;<span style="font-size:11px;color:##606060;">※ 対象日の絞込は未実装です (1999年からの申し送り事項)。</span>
	</form>
</div>

<h2>■ ライン別 生産集計</h2>
<table class="grid" width="100%">
	<tr><th>ライン</th><th>指示件数</th><th>指示数</th><th>完了数</th><th>不良数</th><th>不良率 (完了数ベース)</th><th>達成率</th></tr>
	<cfloop query="qLine">
		<!--- ダッシュボードでは指示数ベース、ここでは完了数ベース。数字が合わないと現場から問い合わせが来る --->
		<cfset fRate = qLine.kanryo GT 0 ? (qLine.furyo / qLine.kanryo) * 100 : 0>
		<cfset aRate = qLine.suryo GT 0 ? (qLine.kanryo / qLine.suryo) * 100 : 0>
		<tr<cfif qLine.currentRow MOD 2 EQ 0> class="alt"</cfif>>
			<td>#qLine.line_cd#</td>
			<td class="num">#qLine.ken#</td>
			<td class="num">#numberFormat(qLine.suryo,",")#</td>
			<td class="num">#numberFormat(qLine.kanryo,",")#</td>
			<td class="num">#qLine.furyo#</td>
			<td class="num"><cfif fRate GTE 3><span class="ng">#numberFormat(fRate,"9.99")#%</span><cfelse>#numberFormat(fRate,"9.99")#%</cfif></td>
			<td class="num">#numberFormat(aRate,"9.9")#%</td>
		</tr>
	</cfloop>
</table>

<table border="0" cellpadding="0" cellspacing="8" width="100%">
<tr valign="top">
<td width="50%">
	<h2>■ 工程別 実績</h2>
	<table class="grid" width="100%">
		<tr><th>工程名</th><th>実績件数</th><th>良品数</th><th>不良数</th></tr>
		<cfloop query="qKotei">
			<tr<cfif qKotei.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qKotei.kotei_nm#</td>
				<td class="num">#qKotei.ken#</td>
				<td class="num">#numberFormat(qKotei.yoryo,",")#</td>
				<td class="num">#qKotei.furyo#</td>
			</tr>
		</cfloop>
	</table>
</td>
<td width="50%">
	<h2>■ 作業者別 実績</h2>
	<table class="grid" width="100%">
		<tr><th>作業者</th><th>実績件数</th><th>良品数</th><th>不良数</th></tr>
		<cfloop query="qSagyou">
			<tr<cfif qSagyou.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qSagyou.sagyousha#</td>
				<td class="num">#qSagyou.ken#</td>
				<td class="num">#numberFormat(qSagyou.yoryo,",")#</td>
				<td class="num">#qSagyou.furyo#</td>
			</tr>
		</cfloop>
	</table>
</td>
</tr>
</table>

<h2>■ 納期遅れ 明細</h2>
<table class="grid" width="100%">
	<tr><th>指示番号</th><th>品目名</th><th>納期</th><th>指示数</th><th>完了数</th><th>残数</th><th>得意先</th></tr>
	<cfloop query="qOkure">
		<tr class="late">
			<td>#qOkure.shiji_no#</td>
			<td>#qOkure.hinmoku_nm#</td>
			<td>#dateFormat(qOkure.noki_ymd,"yyyy/mm/dd")#</td>
			<td class="num">#numberFormat(qOkure.suryo,",")#</td>
			<td class="num">#numberFormat(qOkure.kanryo_suryo,",")#</td>
			<td class="num">#numberFormat(qOkure.suryo - qOkure.kanryo_suryo,",")#</td>
			<td>#qOkure.tokui_nm#</td>
		</tr>
	</cfloop>
	<cfif qOkure.recordCount EQ 0><tr><td colspan="7">該当データなし</td></tr></cfif>
</table>

<p style="font-size:11px;color:##606060;">
	承認欄:&nbsp; 製造課長 [　　　　] &nbsp; 品質保証課長 [　　　　] &nbsp; 工場長 [　　　　]
</p>
</cfoutput>

<cfinclude template="inc/footer.cfm">
