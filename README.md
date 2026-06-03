# Tra cứu cây xăng A97

Ứng dụng Next.js TypeScript giúp người dùng tại Việt Nam tìm cây xăng bán A97, gửi thêm vị trí mới và chờ quản trị viên duyệt trước khi hiển thị công khai.

## Stack

- Next.js App Router + TypeScript
- Google Maps JavaScript API + Places Autocomplete
- PostgreSQL + Prisma
- Redis cache danh sách cây xăng đã duyệt trong 30 phút
- Admin đăng nhập bằng biến môi trường
- Yarn là package manager của dự án

## Chạy local

```bash
yarn install
cp .env.example .env.local
docker compose up -d
yarn prisma:migrate
yarn prisma:seed
yarn dev
```

Cập nhật `ADMIN_PASSWORD` trong `.env.local` trước khi đăng nhập `/admin/login`.

## Google Maps

Ứng dụng dùng Google Maps JavaScript API để hiển thị bản đồ và Places API cho gợi ý địa
chỉ trong form gửi vị trí:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAP_ID=""
NEXT_PUBLIC_GOOGLE_MAP_LANGUAGE="vi"
NEXT_PUBLIC_GOOGLE_MAP_REGION="VN"
NEXT_PUBLIC_MAP_ISSUE_URL="https://support.google.com/maps/"
```

Bản đồ sẽ hoạt động bình thường nếu để trống `NEXT_PUBLIC_GOOGLE_MAP_ID`. Biến này chỉ cần khi bạn
muốn dùng Map ID (vector map styling) và Advanced Marker. Nếu cấu hình sai Map ID, bản đồ có thể bị
trắng/xanh một màu sau khi pan/zoom hoặc sau khi chọn địa chỉ tìm kiếm. Khi gặp lỗi này, thử đặt
`NEXT_PUBLIC_GOOGLE_MAP_ID=""` rồi restart dev server để xác nhận nguyên nhân.


Khuyến nghị production:

- Bật billing cho Google Cloud project và chỉ enable `Maps JavaScript API` + `Places API`.
- Giới hạn browser key bằng HTTP referrer cho domain production, preview và localhost cần thiết.
- Đặt quota/budget alert trong Google Cloud để tránh chi phí bất thường.
- Không cache tile, prediction, place detail hoặc dữ liệu có nguồn từ Google. Ứng dụng chỉ cache dữ
  liệu cây xăng do hệ thống sở hữu trong Redis (`STATIONS_CACHE_TTL_SECONDS = 30 phút`).
- Places Autocomplete chỉ dùng trong form gửi vị trí, tải lazy khi người dùng focus ô tìm địa chỉ,
  debounce sau 3 ký tự và dùng session token cho từng lượt tìm.

Nếu thấy thông báo `Google Maps API key chưa được chấp nhận`, kiểm tra trong Google Cloud:

1. `APIs & Services > Enabled APIs & services` đã bật `Maps JavaScript API` và `Places API`.
2. Billing của project đang hoạt động.
3. API key có application restriction là `Websites` và cho phép tối thiểu:
   - `http://localhost:3000/*`
   - `http://localhost:3001/*`
   - domain production/preview thực tế, ví dụ `https://example.com/*`
4. API restriction của key chỉ cho phép `Maps JavaScript API` và `Places API`.
5. Sau khi đổi restriction, reload dev server vì `NEXT_PUBLIC_*` được đóng gói vào client bundle.

## Seed dữ liệu từ ảnh

File `prisma/seed-data/a97-stations.json` là nguồn dữ liệu seed. Thay nội dung file này bằng dữ liệu đã chép tay và kiểm tra từ ảnh trước khi chạy `yarn prisma:seed`. Bản ghi mẫu đang để `INACTIVE` để tránh hiển thị nhầm dữ liệu giữ chỗ.

## Import dữ liệu cây xăng A97 (JSON/CSV)

Ứng dụng chỉ hiển thị cây xăng `ACTIVE` trên bản đồ. Có thể import dữ liệu hàng loạt từ JSON/CSV:

```bash
yarn tsx scripts/import-stations.ts --input /path/to/a97-stations.json --apply
```

Hoặc chuẩn hóa dữ liệu rồi ghi đè vào file seed:

```bash
yarn tsx scripts/import-stations.ts --input /path/to/a97-stations.csv --write-seed-json
yarn prisma:seed
```

Schema tối thiểu:

- Bắt buộc: `name, address, province, latitude, longitude`
- Tuỳ chọn: `id, brand, ward, district, notes, source, status (ACTIVE|INACTIVE)`

## Kiểm tra

```bash
yarn test
yarn typecheck
yarn lint
yarn build
```

E2E cần database/Redis và dev server:

```bash
docker compose up -d
yarn prisma:migrate
yarn test:e2e
```
