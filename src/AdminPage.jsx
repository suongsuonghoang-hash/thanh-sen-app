import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const emptyPlaceForm = {
  name: "",
  category: "culture",
  lat: "",
  lng: "",
  description: "",
  address: "",
  map: "",
  image: "",
  opening_hours: "",
  ticket_price: "",
  article_title: "",
  article_content: "",
};

const emptyImageForm = {
  place_id: "",
  caption: "",
  sort_order: 0,
};

const categoryOptions = [
  { value: "historical", label: "Di tích lịch sử" },
  { value: "tourism", label: "Địa điểm du lịch" },
  { value: "food", label: "Địa điểm ăn uống" },
  { value: "culture", label: "Nhà văn hoá" },
];

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("places");

  const [places, setPlaces] = useState([]);
  const [placeImages, setPlaceImages] = useState([]);

  const [placeForm, setPlaceForm] = useState(emptyPlaceForm);
  const [editingPlaceId, setEditingPlaceId] = useState(null);

  const [imageForm, setImageForm] = useState(emptyImageForm);
  const [imageFile, setImageFile] = useState(null);

  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [savingPlace, setSavingPlace] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
      }

      await Promise.all([loadPlaces(), loadPlaceImages()]);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadPlaces() {
    setLoadingPlaces(true);

    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Không tải được địa điểm: " + error.message);
      setPlaces([]);
    } else {
      const list = data || [];
      setPlaces(list);

      setImageForm((prev) => ({
        ...prev,
        place_id: prev.place_id || list[0]?.id || "",
      }));
    }

    setLoadingPlaces(false);
  }

  async function loadPlaceImages() {
    setLoadingImages(true);

    const { data, error } = await supabase
      .from("place_images")
      .select(
        `
        *,
        places (
          id,
          name,
          category
        )
      `
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Không tải được hình ảnh: " + error.message);
      setPlaceImages([]);
    } else {
      setPlaceImages(data || []);
    }

    setLoadingImages(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Đăng nhập thất bại: " + error.message);
      return;
    }

    setMessage("Đăng nhập thành công.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMessage("Đã đăng xuất.");
  }

  function handlePlaceChange(e) {
    const { name, value } = e.target;
    setPlaceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleImageChange(e) {
    const { name, value } = e.target;
    setImageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetPlaceForm() {
    setEditingPlaceId(null);
    setPlaceForm(emptyPlaceForm);
  }

  function resetImageForm() {
    setImageFile(null);
    setImageForm({
      ...emptyImageForm,
      place_id: places[0]?.id || "",
    });
  }

  function startPlaceEdit(item) {
    setEditingPlaceId(item.id);
    setPlaceForm({
      name: item.name || "",
      category: item.category || "culture",
      lat: item.lat ?? "",
      lng: item.lng ?? "",
      description: item.description || "",
      address: item.address || "",
      map: item.map || "",
      image: item.image || "",
      opening_hours: item.opening_hours || "",
      ticket_price: item.ticket_price || "",
      article_title: item.article_title || "",
      article_content: item.article_content || "",
    });

    setActiveTab("places");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePlaceSave(e) {
    e.preventDefault();
    setSavingPlace(true);
    setMessage("");

    const payload = {
      name: placeForm.name.trim(),
      category: placeForm.category,
      lat: Number(placeForm.lat),
      lng: Number(placeForm.lng),
      description: placeForm.description.trim() || null,
      address: placeForm.address.trim() || null,
      map: placeForm.map.trim() || null,
      image: placeForm.image.trim() || null,
      opening_hours: placeForm.opening_hours.trim() || null,
      ticket_price: placeForm.ticket_price.trim() || null,
      article_title: placeForm.article_title.trim() || null,
      article_content: placeForm.article_content.trim() || null,
    };

    if (!payload.name) {
      setMessage("Tên địa điểm không được để trống.");
      setSavingPlace(false);
      return;
    }

    if (Number.isNaN(payload.lat) || Number.isNaN(payload.lng)) {
      setMessage("Latitude và Longitude phải là số hợp lệ.");
      setSavingPlace(false);
      return;
    }

    let error;

    if (editingPlaceId) {
      ({ error } = await supabase
        .from("places")
        .update(payload)
        .eq("id", editingPlaceId));
    } else {
      ({ error } = await supabase.from("places").insert([payload]));
    }

    if (error) {
      setMessage("Lưu địa điểm thất bại: " + error.message);
    } else {
      setMessage(
        editingPlaceId ? "Cập nhật địa điểm thành công." : "Thêm địa điểm thành công."
      );
      resetPlaceForm();
      await loadPlaces();
    }

    setSavingPlace(false);
  }

  async function handlePlaceDelete(id) {
    const ok = window.confirm("Xóa địa điểm này?");
    if (!ok) return;

    const { error } = await supabase.from("places").delete().eq("id", id);

    if (error) {
      setMessage("Xóa địa điểm thất bại: " + error.message);
    } else {
      setMessage("Đã xóa địa điểm.");
      await Promise.all([loadPlaces(), loadPlaceImages()]);

      if (editingPlaceId === id) {
        resetPlaceForm();
      }
    }
  }

  async function handleImageSave(e) {
    e.preventDefault();
    setSavingImage(true);
    setUploadingFile(true);
    setMessage("");

    try {
      if (!imageForm.place_id) {
        setMessage("Vui lòng chọn địa điểm.");
        return;
      }

      if (!imageFile) {
        setMessage("Vui lòng chọn file ảnh.");
        return;
      }

      const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${safeExt}`;
      const filePath = `${imageForm.place_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("place-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage("Upload ảnh thất bại: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("place-images")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        setMessage("Không lấy được public URL của ảnh.");
        return;
      }

      const payload = {
        place_id: imageForm.place_id,
        image_url: publicUrl,
        caption: imageForm.caption.trim() || null,
        sort_order: Number(imageForm.sort_order) || 0,
      };

      const { error: insertError } = await supabase
        .from("place_images")
        .insert([payload]);

      if (insertError) {
        setMessage("Lưu thông tin ảnh thất bại: " + insertError.message);
        return;
      }

      setMessage("Thêm ảnh thành công.");
      resetImageForm();
      await loadPlaceImages();
    } finally {
      setSavingImage(false);
      setUploadingFile(false);
    }
  }

  async function handleImageDelete(item) {
    const ok = window.confirm("Xóa ảnh này?");
    if (!ok) return;

    try {
      const imageUrl = item.image_url || "";
      const marker = "/storage/v1/object/public/place-images/";
      const idx = imageUrl.indexOf(marker);

      if (idx !== -1) {
        const filePath = imageUrl.slice(idx + marker.length);

        const { error: storageError } = await supabase.storage
          .from("place-images")
          .remove([filePath]);

        if (storageError) {
          console.error("Lỗi xóa file trong storage:", storageError);
        }
      }

      const { error } = await supabase
        .from("place_images")
        .delete()
        .eq("id", item.id);

      if (error) {
        setMessage("Xóa ảnh thất bại: " + error.message);
      } else {
        setMessage("Đã xóa ảnh.");
        await loadPlaceImages();
      }
    } catch (err) {
      console.error(err);
      setMessage("Xóa ảnh thất bại.");
    }
  }

  const imageGroups = useMemo(() => {
    const grouped = {};

    for (const item of placeImages) {
      const placeName = item.places?.name || "Không rõ địa điểm";
      if (!grouped[placeName]) grouped[placeName] = [];
      grouped[placeName].push(item);
    }

    return grouped;
  }, [placeImages]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold">Đăng nhập quản trị</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              required
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              required
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white"
            >
              Đăng nhập
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trang quản trị</h1>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl border px-4 py-2 font-medium"
          >
            Đăng xuất
          </button>
        </div>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm shadow">{message}</div>
        )}

        <div className="rounded-3xl bg-white p-3 shadow">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("places")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                activeTab === "places" ? "bg-red-600 text-white" : "border text-gray-700"
              }`}
            >
              Quản lý địa điểm
            </button>

            <button
              onClick={() => setActiveTab("images")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                activeTab === "images" ? "bg-red-600 text-white" : "border text-gray-700"
              }`}
            >
              Quản lý hình ảnh
            </button>
          </div>
        </div>

        {activeTab === "places" && (
          <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-bold">
                {editingPlaceId ? "Sửa địa điểm" : "Thêm địa điểm"}
              </h2>

              <form onSubmit={handlePlaceSave} className="space-y-3">
                <input
                  name="name"
                  placeholder="Tên địa điểm"
                  value={placeForm.name}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  required
                />

                <select
                  name="category"
                  value={placeForm.category}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  {categoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <input
                  name="lat"
                  placeholder="Latitude"
                  value={placeForm.lat}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  required
                />

                <input
                  name="lng"
                  placeholder="Longitude"
                  value={placeForm.lng}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  required
                />

                <input
                  name="address"
                  placeholder="Địa chỉ"
                  value={placeForm.address}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <textarea
                  name="description"
                  placeholder="Mô tả ngắn"
                  value={placeForm.description}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  rows={3}
                />

                <input
                  name="article_title"
                  placeholder="Tiêu đề bài giới thiệu"
                  value={placeForm.article_title}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <textarea
                  name="article_content"
                  placeholder="Bài giới thiệu chi tiết về địa điểm..."
                  value={placeForm.article_content}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  rows={8}
                />

                <input
                  name="opening_hours"
                  placeholder="Giờ mở cửa"
                  value={placeForm.opening_hours}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <input
                  name="ticket_price"
                  placeholder="Giá vé"
                  value={placeForm.ticket_price}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <input
                  name="map"
                  placeholder="Link chỉ đường"
                  value={placeForm.map}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <input
                  name="image"
                  placeholder="Ảnh đại diện (URL nếu có)"
                  value={placeForm.image}
                  onChange={handlePlaceChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingPlace}
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white"
                  >
                    {savingPlace
                      ? "Đang lưu..."
                      : editingPlaceId
                      ? "Cập nhật"
                      : "Thêm mới"}
                  </button>

                  <button
                    type="button"
                    onClick={resetPlaceForm}
                    className="rounded-2xl border px-4 py-3 font-medium"
                  >
                    Làm mới
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-bold">Danh sách địa điểm</h2>

              {loadingPlaces ? (
                <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
              ) : (
                <div className="space-y-3">
                  {places.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border p-4"
                    >
                      <div className="min-w-0">
                        <h3 className="font-bold">{item.name}</h3>

                        <p className="text-sm text-gray-500">
                          {
                            categoryOptions.find((x) => x.value === item.category)?.label
                          }{" "}
                          · {item.lat}, {item.lng}
                        </p>

                        {item.address && (
                          <p className="mt-1 text-sm text-gray-500">{item.address}</p>
                        )}

                        {item.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {item.description}
                          </p>
                        )}

                        {item.article_title && (
                          <p className="mt-2 text-sm font-semibold text-gray-800">
                            Bài viết: {item.article_title}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => startPlaceEdit(item)}
                          className="rounded-xl border px-3 py-2 text-sm"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handlePlaceDelete(item.id)}
                          className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}

                  {!places.length && (
                    <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-bold">Upload ảnh cho địa điểm</h2>

              <form onSubmit={handleImageSave} className="space-y-3">
                <select
                  name="place_id"
                  value={imageForm.place_id}
                  onChange={handleImageChange}
                  className="w-full rounded-2xl border px-4 py-3"
                  required
                >
                  <option value="">Chọn địa điểm</option>
                  {places.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border px-4 py-3"
                  required
                />

                <input
                  name="caption"
                  placeholder="Chú thích ảnh"
                  value={imageForm.caption}
                  onChange={handleImageChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <input
                  name="sort_order"
                  type="number"
                  placeholder="Thứ tự hiển thị"
                  value={imageForm.sort_order}
                  onChange={handleImageChange}
                  className="w-full rounded-2xl border px-4 py-3"
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingImage || uploadingFile}
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white"
                  >
                    {uploadingFile
                      ? "Đang upload..."
                      : savingImage
                      ? "Đang lưu..."
                      : "Thêm ảnh"}
                  </button>

                  <button
                    type="button"
                    onClick={resetImageForm}
                    className="rounded-2xl border px-4 py-3 font-medium"
                  >
                    Làm mới
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-bold">Danh sách ảnh địa điểm</h2>

              {loadingImages ? (
                <p className="text-sm text-gray-500">Đang tải hình ảnh...</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(imageGroups).map(([placeName, images]) => (
                    <div key={placeName} className="space-y-3">
                      <h3 className="text-lg font-bold">{placeName}</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            className="overflow-hidden rounded-2xl border bg-white"
                          >
                            <img
                              src={img.image_url}
                              alt={img.caption || placeName}
                              className="h-44 w-full object-cover"
                            />

                            <div className="space-y-2 p-3">
                              {img.caption && (
                                <p className="text-sm text-gray-700">{img.caption}</p>
                              )}

                              <p className="text-xs text-gray-500">
                                Thứ tự: {img.sort_order || 0}
                              </p>

                              <button
                                onClick={() => handleImageDelete(img)}
                                className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white"
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!placeImages.length && (
                    <p className="text-sm text-gray-500">Chưa có ảnh nào.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}