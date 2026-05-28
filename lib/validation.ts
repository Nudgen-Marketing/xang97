import { z } from "zod";

const coordinate = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} phải là số` })
    .min(min, `${label} không hợp lệ`)
    .max(max, `${label} không hợp lệ`);

const optionalText = z
  .literal("")
  .transform(() => undefined)
  .or(z.string().trim().max(500).optional());

const optionalUrl = z
  .literal("")
  .transform(() => undefined)
  .or(z.string().trim().url("Đường dẫn không hợp lệ").max(500).optional());

export const stationSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Tên cây xăng phải có ít nhất 2 ký tự").max(160),
  brand: optionalText,
  address: z.string().trim().min(5, "Địa chỉ phải có ít nhất 5 ký tự").max(260),
  ward: optionalText,
  district: optionalText,
  province: z.string().trim().min(2, "Tỉnh/thành là bắt buộc").max(120),
  latitude: coordinate("Vĩ độ", 8, 24),
  longitude: coordinate("Kinh độ", 102, 110),
  notes: optionalText,
  submitterName: optionalText,
  submitterContact: optionalText,
  photoUrl: optionalUrl,
  sourceUrl: optionalUrl
});

export const moderationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: optionalText,
  address: z.string().trim().min(5).max(260),
  ward: optionalText,
  district: optionalText,
  province: z.string().trim().min(2).max(120),
  latitude: coordinate("Vĩ độ", 8, 24),
  longitude: coordinate("Kinh độ", 102, 110),
  notes: optionalText,
  moderationNotes: optionalText
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export type StationSubmissionInput = z.infer<typeof stationSubmissionSchema>;
export type ModerationInput = z.infer<typeof moderationSchema>;
