# Product flash sale countdown

Display-only. The customer app never invents a flash sale.

## When it shows

A product payload may include optional `flash_sale_ends_at` (ISO-8601 string). If that value is present, parseable, and still in the future, the UI shows `Flash sale ends in …` on:

- product detail (banner under the price)
- product cards (compact badge) when the field is passed through

## When it stays hidden

- field missing, `null`, blank
- unparseable string
- timestamp at or before now

After the clock reaches the end time, the countdown unmounts. No “ended” placeholder.

## Verification

Use dummy ISO timestamps (see `src/lib/flashSaleCountdown.test.ts`). Do not call `*.ordereasy.win` to check this UI.
