=INSERT INTO control_plane.packets (week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping)
VALUES (
  '{{ $json.week_start }}'::date,
  '{{ $json.week_end }}'::date,
  E'{{ $json.packet.packet_title.replace(/\\/g, "\\\\").replace(/'/g, "\\'") }}',
  ARRAY[{{ $json.packet.exec_summary.map(s => "E'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'").join(',') }}]::text[],
  E'{{ JSON.stringify($json.packet.sections).replace(/\\/g, "\\\\").replace(/'/g, "\\'") }}'::jsonb,
  ARRAY[{{ $json.packet.key_questions.map(q => "E'" + q.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'").join(',') }}]::text[],
  E'{{ JSON.stringify($json.packet.bets || []).replace(/\\/g, "\\\\").replace(/'/g, "\\'") }}'::jsonb,
  E'{{ JSON.stringify($json.packet.predictions || []).replace(/\\/g, "\\\\").replace(/'/g, "\\'") }}'::jsonb,
  E'{{ JSON.stringify($json.packet.action_mapping || {}).replace(/\\/g, "\\\\").replace(/'/g, "\\'") }}'::jsonb
)
ON CONFLICT (week_start, week_end) DO UPDATE
SET packet_title = EXCLUDED.packet_title, exec_summary = EXCLUDED.exec_summary, sections = EXCLUDED.sections,
    key_questions = EXCLUDED.key_questions, bets = EXCLUDED.bets, predictions = EXCLUDED.predictions,
    action_mapping = EXCLUDED.action_mapping
RETURNING id;
