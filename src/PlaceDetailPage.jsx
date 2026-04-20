import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, MapPin, Clock3, Ticket } from "lucide-react";
import { supabase } from "./lib/supabase";

const categoryMeta = {
  historical: { label: "Di tích lịch sử" },
  tourism: { label: "Địa điểm du lịch" },
  food: { label: "Địa điểm ăn uống" },
  culture: { label: "Nhà văn hoá" },
};

export default function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [place, setPlace] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    setLoading(true);

    const { data: placeData, error: placeError } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .single();

    if (placeError) {
      console.error("Lỗi tải chi tiết địa điểm:", placeError);
      setPlace(null);
      setImages([]);
      setLoading(false);
      return;
    }

    const { data: imageData, error: imageError } = await supabase
      .from("place_images")
      .select("*")
      .eq("place_id", id)
      .order("sort_order", { ascending: true });

    if (imageError) {
      console.error("Lỗi tải ảnh:", imageError);
      setImages([]);
    } else {
      setImages(imageData || []);
    }

    setPlace(placeData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow">
          Đang tải chi tiết địa điểm...
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow space-y-4">
          <p>Không tìm thấy địa điểm.</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl bg-red-600 px-4 py-2 text-white"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const meta = categoryMeta[place.category] || { label: "Địa điểm" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>

          <p className="text-sm text-red-600 font-semibold">{meta.label}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{place.name}</h1>

          {place.description && (
            <p className="mt-4 text-base leading-7 text-gray-700">
              {place.description}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {place.address && (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Địa chỉ
                </div>
                {place.address}
              </div>
            )}

            {place.opening_hours && (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Clock3 className="h-4 w-4 text-red-600" />
                  Giờ mở cửa
                </div>
                {place.opening_hours}
              </div>
            )}

            {place.ticket_price && (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Ticket className="h-4 w-4 text-red-600" />
                  Giá vé
                </div>
                {place.ticket_price}
              </div>
            )}
          </div>

          {(place.article_title || place.article_content) && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <h2 className="text-xl font-bold text-gray-900">
                {place.article_title || "Giới thiệu địa điểm"}
              </h2>
              <div className="mt-3 whitespace-pre-line text-base leading-8 text-gray-700">
                {place.article_content}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Hình ảnh giới thiệu</h2>
            </div>

            {images.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-2xl border bg-white">
                    <img
                      src={img.image_url}
                      alt={img.caption || place.name}
                      className="h-64 w-full object-cover"
                    />
                    {img.caption && (
                      <div className="p-3 text-sm text-gray-600">{img.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">
                Chưa có hình ảnh cho địa điểm này.
              </div>
            )}
          </div>

          <div className="mt-6">
            {place.map ? (
              <a
                href={place.map}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white"
              >
                Chỉ đường
              </a>
            ) : (
              <div className="inline-flex rounded-2xl bg-gray-100 px-5 py-3 text-gray-400">
                Chưa có link chỉ đường
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}