import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
if (apiKey.trim().length === 0) {
  console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

type SeedStation = {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  province: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  source: string;
  status: "ACTIVE" | "INACTIVE";
};

const placesTextSearchSchema = z.object({
  status: z.string(),
  results: z.array(
    z.object({
      geometry: z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number()
        })
      })
    })
  )
});

const stationsInput = [
  {
    id: "hcm-q1-xd-9",
    name: "Cửa hàng XD số 9",
    addressLine: "52 Bùi Thị Xuân",
    ward: "Bến Thành",
    district: "Quận 1"
  },
  {
    id: "hcm-q3-xd-13",
    name: "Cửa hàng XD số 13",
    addressLine: "118 Cách Mạng Tháng 8",
    ward: "7",
    district: "Quận 3"
  },
  {
    id: "hcm-q5-xd-12",
    name: "Cửa hàng XD số 12",
    addressLine: "912 Võ Văn Kiệt",
    ward: "5",
    district: "Quận 5"
  },
  {
    id: "hcm-q6-xd-10",
    name: "Cửa hàng XD số 10",
    addressLine: "784-786 Hậu Giang",
    ward: "12",
    district: "Quận 6"
  },
  {
    id: "hcm-q10-xd-11",
    name: "Cửa hàng XD số 11",
    addressLine: "186 Tô Hiến Thành",
    ward: "15",
    district: "Quận 10"
  },
  {
    id: "hcm-q11-xd-16",
    name: "Cửa hàng XD số 16",
    addressLine: "260A Lạc Long Quân",
    ward: "10",
    district: "Quận 11"
  },
  {
    id: "hcm-binh-thanh-xd-4",
    name: "Cửa hàng XD số 4",
    addressLine: "167 Điện Biên Phủ",
    ward: "15",
    district: "Bình Thạnh"
  },
  {
    id: "hcm-binh-thanh-xd-5",
    name: "Cửa hàng XD số 5",
    addressLine: "234 Bạch Đằng",
    ward: "24",
    district: "Bình Thạnh"
  },
  {
    id: "hcm-binh-thanh-xd-8",
    name: "Cửa hàng XD số 8",
    addressLine: "135 Nơ Trang Long",
    ward: "12",
    district: "Bình Thạnh"
  },
  {
    id: "hcm-q2-xd-6",
    name: "Cửa hàng XD số 6",
    addressLine: "9Bis Trần Não",
    ward: "An Khánh",
    district: "Quận 2"
  },
  {
    id: "hcm-go-vap-xd-18",
    name: "Cửa hàng XD số 18",
    addressLine: "A21 Quang Trung",
    ward: "10",
    district: "Gò Vấp"
  },
  {
    id: "hcm-go-vap-xd-19",
    name: "Cửa hàng XD số 19",
    addressLine: "247 Lê Quang Định",
    ward: "1",
    district: "Gò Vấp"
  },
  {
    id: "hcm-tan-binh-xd-17",
    name: "Cửa hàng XD số 17",
    addressLine: "401 Trường Chinh",
    ward: "14",
    district: "Tân Bình"
  },
  {
    id: "hcm-tan-phu-xd-24",
    name: "Cửa hàng XD số 24",
    addressLine: "64 Lũy Bán Bích",
    ward: "Tân Thới Hòa",
    district: "Tân Phú"
  },
  {
    id: "hcm-q12-xd-3",
    name: "Cửa hàng XD số 3",
    addressLine: "16A Quốc lộ 22",
    ward: "Trung Mỹ Tây",
    district: "Quận 12"
  },
  {
    id: "hcm-q12-xd-20",
    name: "Cửa hàng XD số 20",
    addressLine: "387A Lê Văn Khương",
    ward: "Hiệp Thành",
    district: "Quận 12"
  },
  {
    id: "hcm-binh-chanh-xd-21",
    name: "Cửa hàng XD số 21",
    addressLine: "Lô V1, KCN Lê Minh Xuân",
    ward: null,
    district: "Bình Chánh"
  }
] as const;

const province = "TP. Hồ Chí Minh";
const source = "otosigon-image";
const notes = "Tổng hợp từ ảnh danh sách cây xăng bán xăng 97 tại TP.HCM.";

async function placeTextSearch(query: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("region", "vn");
  url.searchParams.set("language", "vi");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`PLACES_HTTP_${response.status}`);
  }

  const payload = placesTextSearchSchema.parse(await response.json());
  if (payload.status !== "OK" || payload.results.length === 0) {
    throw new Error(`PLACES_${payload.status}`);
  }

  const location = payload.results[0].geometry.location;
  return {
    latitude: Number(location.lat.toFixed(6)),
    longitude: Number(location.lng.toFixed(6))
  };
}

async function main() {
  const output: SeedStation[] = [];

  for (let i = 0; i < stationsInput.length; i += 1) {
    const station = stationsInput[i];
    const parts = [
      station.addressLine,
      station.ward ? `Phường ${station.ward}` : null,
      station.district,
      province,
      "Việt Nam"
    ].filter(Boolean);
    const fullAddress = parts.join(", ");
    console.log(`Geocoding ${i + 1}/${stationsInput.length}: ${station.name}`);
    const coordinates = await placeTextSearch(fullAddress);

    output.push({
      id: station.id,
      name: station.name,
      brand: null,
      address: fullAddress,
      ward: station.ward,
      district: station.district,
      province,
      ...coordinates,
      notes,
      source,
      status: "ACTIVE"
    });
  }

  const seedPath = join(process.cwd(), "prisma", "seed-data", "a97-stations.json");
  writeFileSync(seedPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${output.length} stations to ${seedPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
