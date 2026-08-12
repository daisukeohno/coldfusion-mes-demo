<!--- 品質検査入力/一覧。判定ロジックがこの画面のみに埋め込まれている --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.shiji_no" default="">
<cfparam name="url.hantei"   default="">
<cfparam name="form.mode"    default="">
<cfset msg = "">

<cfif form.mode EQ "regist">
	<cfif NOT isNumeric(form.sunpou)>
		<cfset msg = "NG:測定値は数値で入力してください。">
	<cfelse>
		<!--- 規格値は画面のhiddenから来る。マスタ化されていないので画面ごとに値が違う --->
		<cfset hantei = "OK">
		<cfif form.sunpou LT form.kijun_min OR form.sunpou GT form.kijun_max>
			<cfset hantei = "NG">
		</cfif>
		<!--- 2011年の暫定対応: 上限ぎりぎりは再検査扱い。仕様書には記載なし --->
		<cfif hantei EQ "OK" AND (form.kijun_max - form.sunpou) LT 0.010>
			<cfset hantei = "再検査">
		</cfif>
		<cfquery datasource="mesdb">
			insert into t_kensa (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
			values (
				  <cfqueryparam value="#form.shiji_no#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.lot_no#" cfsqltype="cf_sql_varchar">
				, curdate()
				, <cfqueryparam value="#form.kensa_sha#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.sunpou#" cfsqltype="cf_sql_decimal" scale="3">
				, <cfqueryparam value="#form.kijun_min#" cfsqltype="cf_sql_decimal" scale="3">
				, <cfqueryparam value="#form.kijun_max#" cfsqltype="cf_sql_decimal" scale="3">
				, <cfqueryparam value="#hantei#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.furyo_naiyo#" cfsqltype="cf_sql_varchar">
			)
		</cfquery>
		<cfset msg = "OK:検査結果を登録しました。判定は " & hantei & " です。">
	</cfif>
</cfif>

<cfquery name="qShijiList" datasource="mesdb">
	select s.shiji_no, h.hinmoku_nm from t_seizou_shiji s, m_hinmoku h
	where s.hinmoku_cd = h.hinmoku_cd order by s.shiji_no desc
</cfquery>

<cfset where = "">
<cfif len(url.shiji_no)><cfset where = where & " and k.shiji_no = '" & url.shiji_no & "'"></cfif>
<cfif len(url.hantei)><cfset where = where & " and k.hantei = '" & url.hantei & "'"></cfif>

<cfquery name="qKensa" datasource="mesdb">
	select k.*, h.hinmoku_nm, s.line_cd
	from t_kensa k, t_seizou_shiji s, m_hinmoku h
	where k.shiji_no = s.shiji_no and s.hinmoku_cd = h.hinmoku_cd
	#preserveSingleQuotes(where)#
	order by k.kensa_ymd desc, k.kensa_id desc
</cfquery>

<cfquery name="qFuryo" datasource="mesdb">
	select furyo_naiyo, count(*) as ken from t_kensa
	where hantei <> 'OK' and furyo_naiyo <> ''
	group by furyo_naiyo order by ken desc
</cfquery>

<cfoutput>
<h1>品質検査</h1>

<cfif len(msg)>
	<div class="box"><b<cfif left(msg,2) NEQ "OK"> class="ng"</cfif>>#listRest(msg,":")#</b></div>
</cfif>

<div class="box">
<form method="post" action="inspection.cfm">
	<input type="hidden" name="mode" value="regist">
	<table border="0" cellpadding="4" cellspacing="0">
		<tr>
			<td width="90">製造指示</td>
			<td>
				<select name="shiji_no">
					<cfloop query="qShijiList">
						<option value="#qShijiList.shiji_no#"<cfif url.shiji_no EQ qShijiList.shiji_no> selected</cfif>>#qShijiList.shiji_no# / #qShijiList.hinmoku_nm#</option>
					</cfloop>
				</select>
			</td>
			<td width="60">ロット</td>
			<td><input type="text" name="lot_no" value="LOT-#dateFormat(now(),'mmdd')#-01" size="14"></td>
			<td width="60">検査者</td>
			<td><input type="text" name="kensa_sha" value="高橋 花子" size="12"></td>
		</tr>
		<tr>
			<td>測定値 (mm)</td>
			<td><input type="text" name="sunpou" value="220.000" size="10"></td>
			<td>規格下限</td>
			<td><input type="text" name="kijun_min" value="219.900" size="10"></td>
			<td>規格上限</td>
			<td><input type="text" name="kijun_max" value="220.100" size="10"></td>
		</tr>
		<tr>
			<td>不良内容</td>
			<td colspan="3"><input type="text" name="furyo_naiyo" value="" size="46"></td>
			<td colspan="2"><input type="submit" value="　判定・登録　" class="btn"></td>
		</tr>
	</table>
</form>
<div style="font-size:11px;color:##606060;padding-top:4px;">
	※ 判定は規格範囲で自動決定します。規格上限との差が 0.010mm 未満の場合は「再検査」となります (2011年 暫定運用)。
</div>
</div>

<table border="0" cellpadding="0" cellspacing="8" width="100%">
<tr valign="top">
<td width="72%">
	<h2>■ 検査履歴
		&nbsp;<span style="font-weight:normal;font-size:11px;">
		絞込: <a href="inspection.cfm">すべて</a> |
		<a href="inspection.cfm?hantei=NG">NGのみ</a> |
		<a href="inspection.cfm?hantei=%E5%86%8D%E6%A4%9C%E6%9F%BB">再検査のみ</a></span>
	</h2>
	<table class="grid" width="100%">
		<tr><th>検査ID</th><th>指示番号</th><th>品目名</th><th>ライン</th><th>ロット</th><th>検査日</th><th>検査者</th><th>測定値</th><th>規格範囲</th><th>判定</th><th>不良内容</th></tr>
		<cfloop query="qKensa">
			<tr<cfif qKensa.hantei EQ "NG"> class="late"<cfelseif qKensa.hantei EQ "再検査"> class="warn"<cfelseif qKensa.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td class="num">#qKensa.kensa_id#</td>
				<td><a href="order_detail.cfm?shiji_no=#qKensa.shiji_no#">#qKensa.shiji_no#</a></td>
				<td>#qKensa.hinmoku_nm#</td>
				<td>#qKensa.line_cd#</td>
				<td>#qKensa.lot_no#</td>
				<td>#dateFormat(qKensa.kensa_ymd,"yyyy/mm/dd")#</td>
				<td>#qKensa.kensa_sha#</td>
				<td class="num">#numberFormat(qKensa.sunpou,"9.999")#</td>
				<td class="num">#numberFormat(qKensa.kijun_min,"9.999")# - #numberFormat(qKensa.kijun_max,"9.999")#</td>
				<td><cfif qKensa.hantei EQ "OK"><span class="ok">OK</span><cfelse><span class="ng">#qKensa.hantei#</span></cfif></td>
				<td>#qKensa.furyo_naiyo#</td>
			</tr>
		</cfloop>
	</table>
	<p>#qKensa.recordCount# 件</p>
</td>
<td width="28%">
	<h2>■ 不良内容 集計</h2>
	<table class="grid" width="100%">
		<tr><th>不良内容</th><th>件数</th></tr>
		<cfloop query="qFuryo">
			<tr<cfif qFuryo.currentRow MOD 2 EQ 0> class="alt"</cfif>>
				<td>#qFuryo.furyo_naiyo#</td>
				<td class="num">#qFuryo.ken#</td>
			</tr>
		</cfloop>
	</table>
</td>
</tr>
</table>
</cfoutput>

<cfinclude template="inc/footer.cfm">
