import { expect, test } from "@playwright/test";

test("public app loads map-first A97 experience", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009 });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Tra cứu cây xăng bán A97/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dùng vị trí hiện tại/i })).toBeVisible();
  await expect(page.getByTestId("google-map-shell")).toBeVisible();
  await expect(page.getByText("Quần đảo Hoàng Sa")).toBeVisible();
  await expect(page.getByText("Quần đảo Trường Sa")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Danh sách cây xăng/i })).toBeVisible();
  await expect(page.getByText(/Trang \d+ \/ \d+/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Trước/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sau/i })).toBeVisible();
});

test("public submit form can be opened", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Gửi vị trí/i }).click();

  await expect(page.getByRole("heading", { name: /Tìm địa điểm gần bạn/i })).toBeHidden();
  await expect(page.getByRole("heading", { name: /Đặt vị trí cây xăng A97/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nhập địa chỉ" })).toBeVisible();
  await page.getByRole("button", { name: /Tiếp tục điền thông tin/i }).click();
  await expect(page.getByRole("heading", { name: /Nhập thông tin cây xăng/i })).toBeVisible();
  await expect(page.getByLabel("Tên cây xăng")).toBeVisible();
});

test("public submit flow uses geolocation and shows success after posting", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009 });
  await page.route("**/api/submissions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 201,
      body: JSON.stringify({
        success: true,
        data: { id: "ticket-123", status: "PENDING" }
      })
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Gửi vị trí/i }).click();
  await expect(page.getByTestId("google-map-shell")).toBeVisible();

  await page.getByRole("button", { name: /Dùng vị trí hiện tại/i }).first().click();
  await expect(page.getByText(/Tọa độ: 10\.776900, 106\.700900/)).toBeVisible();

  await page.getByRole("button", { name: /Tiếp tục điền thông tin/i }).click();
  await expect(page.getByRole("heading", { name: /Nhập thông tin cây xăng/i })).toBeVisible();
  await expect(page.getByLabel("Vĩ độ")).toHaveValue("10.7769");
  await expect(page.getByLabel("Kinh độ")).toHaveValue("106.7009");

  await page.getByLabel("Tên cây xăng").fill("Cây xăng A97 kiểm thử");
  await page.getByLabel("Tỉnh/thành").fill("TP. Hồ Chí Minh");
  await page.getByLabel("Địa chỉ").fill("123 Nguyễn Huệ, Quận 1");
  await page.getByRole("button", { name: /Gửi chờ duyệt/i }).click();

  await expect(page.getByRole("heading", { name: /Gửi địa điểm thành công/i })).toBeVisible();
  await expect(page.getByText(/Mã ticket: ticket-123/)).toBeVisible();
  await page.getByRole("button", { name: /Về bản đồ/i }).click();
  await expect(page.getByRole("heading", { name: /Danh sách cây xăng/i })).toBeVisible();
});

test("public submit flow recovers from an invalid submissions response", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009 });
  await page.route("**/api/submissions", async (route) => {
    await route.fulfill({
      contentType: "text/plain",
      status: 500,
      body: "not json"
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Gửi vị trí/i }).click();
  await page.getByRole("button", { name: /Dùng vị trí hiện tại/i }).first().click();
  await page.getByRole("button", { name: /Tiếp tục điền thông tin/i }).click();

  await page.getByLabel("Tên cây xăng").fill("Cây xăng A97 kiểm thử");
  await page.getByLabel("Tỉnh/thành").fill("TP. Hồ Chí Minh");
  await page.getByLabel("Địa chỉ").fill("123 Nguyễn Huệ, Quận 1");
  await page.getByRole("button", { name: /Gửi chờ duyệt/i }).click();

  await expect(page.getByText("Không thể gửi vị trí. Hãy thử lại sau.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Gửi chờ duyệt/i })).toBeEnabled();
});
