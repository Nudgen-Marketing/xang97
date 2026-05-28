import { expect, test } from "@playwright/test";

test("public app loads map-first A97 experience", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009 });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Tra cứu cây xăng bán A97/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Gần tôi/i })).toBeVisible();
  await expect(page.getByTestId("google-map-shell")).toBeVisible();
  await expect(page.getByText("Quần đảo Hoàng Sa")).toBeVisible();
  await expect(page.getByText("Quần đảo Trường Sa")).toBeVisible();
  await expect(page.getByText("Bản đồ Việt Nam, bao gồm Hoàng Sa và Trường Sa")).toBeVisible();
});

test("public submit form can be opened", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Gửi vị trí/i }).click();

  await expect(page.getByRole("heading", { name: /Gửi cây xăng bán A97/i })).toBeVisible();
  await expect(page.getByText("Tìm địa chỉ bằng Google Maps")).toBeVisible();
  await expect(page.getByLabel("Tên cây xăng")).toBeVisible();
});
