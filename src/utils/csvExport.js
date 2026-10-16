/**
 * Exports feed history records as UTF-8 CSV with Byte Order Mark (BOM)
 * to ensure Marathi / Devanagari characters render properly in Microsoft Excel.
 */
export function exportFeedHistoryToCsv(records, language = 'en') {
  if (!records || records.length === 0) {
    alert(language === 'mr' ? 'निर्यात करण्यासाठी कोणत्याही नोंदी नाहीत.' : 'No records available to export.');
    return;
  }

  const isMr = language === 'mr';

  const headers = isMr
    ? [
        'तारीख व वेळ',
        'माशांची जात',
        'शास्त्रीय नाव',
        'संवर्धन टप्पा',
        'साठवणूक संख्या (नग)',
        'सर्व्हायव्हल (%)',
        'सरासरी वजन (ग्रॅम)',
        'जिवंत मासळी (नग)',
        'खाद्य दर (%)',
        'दर स्रोत',
        'एकूण बायोमास (किलो)',
        'दैनिक खाद्य (किलो)',
        'सकाळचे खाद्य (किलो)',
        'संध्याकाळचे खाद्य (किलो)',
        'खाद्याचा दर (₹/किलो)',
        'दैनिक खाद्य खर्च (₹)',
        'नियम तपशील',
        'आवश्यक गणना केलेले खाद्य (किलो)',
        'निश्चित केलेले खाद्य प्रमाण (किलो)',
        'प्रत्यक्ष दिलेले खाद्य (किलो)',
        'फरक (किलो)',
        'फरक (%)',
        'प्रत्यक्ष खाद्य खर्च (₹)',
        'खाद्य ट्रे निरीक्षण',
        'गंभीर परिस्थिती बदल',
        'फरकाचे कारण / शेरा',
        'खाद्य सत्र',
        'निरीक्षण पद्धत',
        'पर्यावरणीय बदल',
        'चेक-ट्रे नमुना खाद्य (ग्रॅम)'
      ]
    : [
        'Date & Time',
        'Species',
        'Scientific Name',
        'Culture Stage',
        'Stocked Fish',
        'Survival (%)',
        'Average Weight (g)',
        'Surviving Fish',
        'Feeding Rate (%)',
        'Rate Source',
        'Biomass (kg)',
        'Daily Feed (kg)',
        'Morning Feed (kg)',
        'Evening Feed (kg)',
        'Feed Price (₹/kg)',
        'Daily Feed Cost (₹)',
        'Rule Details',
        'Calculated Feed Required (kg)',
        'Confirmed Feeding Quantity (kg)',
        'Actual Feed Given (kg)',
        'Difference (kg)',
        'Difference (%)',
        'Actual Feed Cost (₹)',
        'Feeding-Tray Observation',
        'Critical Conditions',
        'Difference Reason / Notes',
        'Feeding Session',
        'Observation Method',
        'Environmental Overrides',
        'Check-Tray Sample (g)'
      ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => {
    const formattedDate = new Date(r.created_at).toLocaleString(isMr ? 'mr-IN' : 'en-IN');
    const sourceLabel = r.rate_source === 'FARMER_ENTERED'
      ? (isMr ? 'शेतकऱ्याने भरलेला दर' : 'Entered by farmer')
      : (isMr ? 'स्वयंचलित नियम' : 'Automatic rule');

    const ruleExpl = isMr ? (r.rule_explanation_mr || r.rule_explanation) : (r.rule_explanation || r.rule_explanation_mr);

    // Feature 3 Fields Handling (Preserves older records without assuming actual = calculated)
    const calcFeed = r.calculated_feed !== undefined && r.calculated_feed !== null ? Number(r.calculated_feed).toFixed(2) : Number(r.daily_feed).toFixed(2);
    const confFeed = r.confirmed_feed !== undefined && r.confirmed_feed !== null ? Number(r.confirmed_feed).toFixed(2) : Number(r.daily_feed).toFixed(2);
    const hasActual = r.actual_feed !== undefined && r.actual_feed !== null && r.actual_feed !== '' && !isNaN(Number(r.actual_feed));
    const notRec = isMr ? 'नोंदवलेले नाही' : 'Not recorded';

    const actualFeedStr = hasActual ? Number(r.actual_feed).toFixed(2) : notRec;
    const diffKgStr = hasActual
      ? (r.difference_kg !== undefined && r.difference_kg !== null ? Number(r.difference_kg).toFixed(2) : (Number(r.actual_feed) - Number(calcFeed)).toFixed(2))
      : notRec;
    
    let diffPctStr = notRec;
    if (hasActual) {
      if (Number(calcFeed) === 0) {
        diffPctStr = isMr ? 'लागू नाही' : 'Not applicable';
      } else if (r.difference_percent !== undefined && r.difference_percent !== null) {
        diffPctStr = `${Number(r.difference_percent).toFixed(1)}%`;
      } else {
        const pct = ((Number(r.actual_feed) - Number(calcFeed)) / Number(calcFeed)) * 100;
        diffPctStr = `${pct.toFixed(1)}%`;
      }
    }

    const actualCostStr = hasActual
      ? (r.actual_feed_cost !== undefined && r.actual_feed_cost !== null ? Math.round(Number(r.actual_feed_cost)) : Math.round(Number(r.actual_feed) * Number(r.feed_price || 0)))
      : notRec;

    const trayObsStr = r.observation || r.tray_observation || (isMr ? 'निरीक्षण नाही' : 'No observation');
    const critCondStr = Array.isArray(r.critical_conditions) && r.critical_conditions.length > 0 ? r.critical_conditions.join('; ') : (isMr ? 'कोणतेही नाही' : 'None');
    const diffReasonStr = r.difference_reason || r.notes || '';

    // New columns
    const sessionStr = r.session ? r.session : notRec;
    const obsMethodStr = r.observation_method ? r.observation_method : notRec;
    const envOverridesStr = r.environmental_override_reason || (isMr ? 'लागू नाही' : 'None');
    const checkTrayGStr = (r.check_tray_feed_g !== undefined && r.check_tray_feed_g !== null) ? Number(r.check_tray_feed_g).toFixed(1) : notRec;

    return [
      escapeCell(formattedDate),
      escapeCell(r.species),
      escapeCell(r.scientific_name || ''),
      escapeCell(r.culture_stage),
      escapeCell(r.stocked),
      escapeCell(r.survival_percent),
      escapeCell(r.average_weight),
      escapeCell(r.surviving_fish),
      escapeCell(r.feeding_rate),
      escapeCell(sourceLabel),
      escapeCell(r.biomass),
      escapeCell(r.daily_feed),
      escapeCell(r.morning_feed),
      escapeCell(r.evening_feed),
      escapeCell(r.feed_price || 0),
      escapeCell(r.feed_cost || 0),
      escapeCell(ruleExpl || ''),
      escapeCell(calcFeed),
      escapeCell(confFeed),
      escapeCell(actualFeedStr),
      escapeCell(diffKgStr),
      escapeCell(diffPctStr),
      escapeCell(actualCostStr),
      escapeCell(trayObsStr),
      escapeCell(critCondStr),
      escapeCell(diffReasonStr),
      escapeCell(sessionStr),
      escapeCell(obsMethodStr),
      escapeCell(envOverridesStr),
      escapeCell(checkTrayGStr)
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `Aquaculture_Feed_History_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
