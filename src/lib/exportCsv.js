/**
 * Exports feed history records as a UTF-8 CSV file with BOM
 * so that Marathi and Devanagari characters render properly in Microsoft Excel.
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
        'साठवणूक संख्या',
        'सर्व्हायव्हल (%)',
        'सरासरी वजन (ग्रॅम)',
        'जिवंत मासळी',
        'खाद्य दर (%)',
        'दर स्रोत',
        'एकूण बायोमास (किलो)',
        'दैनिक खाद्य (किलो)',
        'सकाळचे खाद्य (किलो)',
        'संध्याकाळचे खाद्य (किलो)',
        'खाद्य दर (₹/किलो)',
        'दैनिक खाद्य खर्च (₹)',
        'नियम तपशील'
      ]
    : [
        'Date & Time',
        'Species',
        'Scientific Name',
        'Culture Stage',
        'Stocked',
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
        'Rule Details'
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
      escapeCell(ruleExpl || '')
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
