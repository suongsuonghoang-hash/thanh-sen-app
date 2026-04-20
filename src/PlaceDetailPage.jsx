import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  MapPin,
  Clock3,
  Ticket,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [previewIndex, setPreviewIndex] = useState(null);

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
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (imageError) {
      console.error("Lỗi tải ảnh:", imageError);
      setImages([]);
    } else {
      setImages(imageData || []);
    }

    setPlace(placeData);
    setLoading(false);
  }

  function openPreview(index) {
    setPreviewIndex(index);
  }

  function closePreview() {
    setPreviewIndex(null);
  }

  function showPrevImage() {
    if (!images.length) return;
    setPreviewIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function showNextImage() {
    if (!images.length) return;
    setPreviewIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (previewIndex === null) return;

      if (e.key === "Escape") closePreview();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, images]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow">
          Đang tải chi tiết địa điểm...
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow space-y-4">
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
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow sm:p-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>

          <p className="text-sm font-semibold text-red-600">{meta.label}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{place.name}</h1>

          {place.image && (
            <div className="mt-5 overflow-hidden rounded-3xl border">
              <img
                src={place.image}
                alt={place.name}
                className="h-72 w-full object-cover sm:h-96"
              />
            </div>
          )}

          {place.description && (
            <p className="mt-5 text-base leading-7 text-gray-700">
              {place.description}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
              <h2 className="text-xl font-bold text-gray-900">
                Hình ảnh giới thiệu
              </h2>
            </div>

            {images.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openPreview(index)}
                    className="overflow-hidden rounded-2xl border bg-white text-left transition hover:shadow-md"
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption || place.name}
                      className="h-64 w-full object-cover"
                    />
                    {img.caption && (
                      <div className="p-3 text-sm text-gray-600">
                        {img.caption}
                      </div>
                    )}
                  </button>
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

      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-800 shadow"
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevImage}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <img
              src={images[previewIndex].image_url}
              alt={images[previewIndex].caption || place.name}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {(images[previewIndex].caption || place.name) && (
              <div className="mt-3 rounded-2xl bg-white/95 px-4 py-3 text-sm text-gray-700">
                {images[previewIndex].caption || place.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}