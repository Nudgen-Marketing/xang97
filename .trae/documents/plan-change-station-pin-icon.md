## Summary

Đổi “pin” của cây xăng trên bản đồ từ chữ “A” sang glyph emoji ⛽ để nhìn đúng ngữ nghĩa “cây xăng/bán nhiên liệu” hơn, không cần thêm asset ảnh và vẫn tương thích cả Advanced Markers lẫn legacy markers.

## Current State Analysis

- Bản đồ dùng Google Maps JavaScript API, tạo marker qua `PinElement` (khi có `GOOGLE_MAPS_MAP_ID`) hoặc fallback `google.maps.Marker` + `label` (khi không có map id): [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L100-L126), [google-maps.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/google-maps.ts#L19-L59)
- Marker cây xăng hiện đang dùng glyph `"A"` trong `StationMap` khi render danh sách trạm: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L367-L401)
- Marker người dùng (`•`) và marker chọn vị trí (`✓`) đang khác glyph và không nằm trong scope thay đổi: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L424-L448), [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L587-L610)

## Proposed Changes

### 1) Đổi glyph marker cây xăng sang emoji ⛽

- File: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L367-L401)
- Thay `glyph: "A"` thành `glyph: "⛽"`
- Giữ nguyên màu pin hiện có (xanh mặc định, đỏ khi selected) để không làm thay đổi hệ thống màu.
- Điều chỉnh nhẹ `scale` nếu cần để emoji không bị quá chật (mặc định giữ nguyên `1.1/1.25`; khi chạy thực tế nếu emoji quá to/nhỏ sẽ chốt lại bằng quan sát UI).

### 2) (Tuỳ chọn) Cố định glyph cho legacy label nếu emoji bị lệch

Chỉ thực hiện nếu emoji hiển thị không ổn trên legacy marker (khi không có `GOOGLE_MAPS_MAP_ID`):

- File: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx)
- Tách label helper cho “pin glyph” (fontSize nhỏ hơn một chút) để không ảnh hưởng label quần đảo, và chỉ áp dụng cho marker cây xăng.

## Assumptions & Decisions

- Quyết định dùng emoji ⛽ (theo lựa chọn của bạn) để:
  - Không phải thêm file SVG/PNG vào repo.
  - Tương thích ngay với `PinElement.glyph` (string) và `MarkerLabel.text` (string) ở chế độ legacy.
- Scope: chỉ đổi marker cây xăng (stations), không đổi icon UI (MapPin trong header/autocomplete) và không đổi marker “vị trí hiện tại” / “vị trí bạn chọn”.

## Verification Steps

- Chạy `yarn typecheck` để đảm bảo không lỗi TypeScript.
- Chạy `yarn test` để đảm bảo bộ test hiện có vẫn pass.
- Chạy `yarn dev`, mở trang chủ và xác nhận:
  - Tất cả cây xăng trên bản đồ hiển thị glyph ⛽.
  - Khi click chọn 1 cây xăng, marker selected vẫn phân biệt rõ (màu + scale) và info window hoạt động bình thường.
  - Thử cả 2 mode:
    - Có `NEXT_PUBLIC_GOOGLE_MAP_ID` (Advanced Marker).
    - Không có `NEXT_PUBLIC_GOOGLE_MAP_ID` (legacy marker).

