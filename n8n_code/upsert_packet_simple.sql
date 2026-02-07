=INSERT INTO control_plane.packets (week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping)
VALUES (
  '{{ $json.week_start }}'::date,
  '{{ $json.week_end }}'::date,
  '{{ $json.packet_title_escaped }}',
  ARRAY[{{ $json.exec_summary_escaped.map(s => "'" + s + "'").join(',') }}]::text[],
  '{{ $json.sections_escaped }}'::jsonb,
  ARRAY[{{ $json.key_questions_escaped.map(q => "'" + q + "'").join(',') }}]::text[],
  '{{ $json.bets_escaped }}'::jsonb,
  '{{ $json.predictions_escaped }}'::jsonb,
  '{{ $json.action_mapping_escaped }}'::jsonb
)
ON CONFLICT (week_start, week_end) DO UPDATE
SET packet_title = EXCLUDED.packet_title, exec_summary = EXCLUDED.exec_summary, sections = EXCLUDED.sections,
    key_questions = EXCLUDED.key_questions, bets = EXCLUDED.bets, predictions = EXCLUDED.predictions,
    action_mapping = EXCLUDED.action_mapping
RETURNING id;
