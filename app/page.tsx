import { MapPin, ShieldCheck } from "lucide-react";
import { A97App } from "@/components/A97App";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
              <MapPin size={18} aria-hidden />
              Bản đồ cộng đồng
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal md:text-4xl">
              Tra cứu cây xăng bán A97 tại Việt Nam
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)] md:text-base">
              Tìm cây xăng A97 quanh bạn, gửi thêm địa điểm mới và chờ quản trị viên xác minh
              trước khi hiển thị công khai.
            </p>
          </div>
          <a className="a97-button secondary w-fit" href="/admin/login">
            <ShieldCheck size={18} aria-hidden />
            Quản trị
          </a>
        </div>
      </header>
      <A97App />
    </main>
  );
}
