-- These keys match ResponsiveTables.tsx and table-patterns.ts. Never repurpose them.
insert into public.surveys(survey_key, title, selection_type, min_selections, max_selections)
values
  ('responsive-tables-flat-v1', '모바일에서는 어떤 테이블 UI가 가장 편한가요?', 'radio', 1, 1),
  ('responsive-tables-inner-v1', '모바일에서는 어떤 Inner Table UI가 편한가요?', 'checkbox', 2, 3);

insert into public.survey_options(survey_id, option_key, title, sort_order)
select s.id, o.option_key, o.title, o.sort_order
from public.surveys s
join (values
  ('responsive-tables-flat-v1', 'scroll', '가로 스크롤', 0),
  ('responsive-tables-flat-v1', 'sticky', '헤더 · 첫 열 고정', 1),
  ('responsive-tables-flat-v1', 'cards', '카드로 전환', 2),
  ('responsive-tables-flat-v1', 'priority', '중요한 열 먼저', 3),
  ('responsive-tables-flat-v1', 'popin', '행 아래로 재배치', 4),
  ('responsive-tables-flat-v1', 'expand', '필요한 행만 펼치기', 5),
  ('responsive-tables-inner-v1', 'scroll', '공통 열 + 가로 스크롤', 0),
  ('responsive-tables-inner-v1', 'sticky', '요일 고정 + 상세 행', 1),
  ('responsive-tables-inner-v1', 'cards', '요일별 아코디언', 2),
  ('responsive-tables-inner-v1', 'stacked', '상세 행을 두 줄로', 3)
) as o(survey_key, option_key, title, sort_order) on o.survey_key = s.survey_key;

update public.surveys set status = 'open'
where survey_key in ('responsive-tables-flat-v1', 'responsive-tables-inner-v1');
