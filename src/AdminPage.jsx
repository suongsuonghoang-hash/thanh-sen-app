import React, { useEffect, useState } from "react";
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
  const [activeTab, setActiveTab] = useState("all");

  const [places, setPlaces] = useState([]);
  const [placeForm, setPlaceForm] = useState(emptyPlaceForm);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [savingPlace, setSavingPlace] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
      }

      await loadPlaces();
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
      setMessage("Không tải được dữ liệu: " + error.message);
      setPlaces([]);
    } else {
      setPlaces(data || []);
    }

    setLoadingPlaces(false);
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

  function resetPlaceForm() {
    setEditingPlaceId(null);
    setPlaceForm(emptyPlaceForm);
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
    });

    setActiveTab(item.category || "all");
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
      setMessage("Lưu thất bại: " + error.message);
    } else {
      setMessage(editingPlaceId ? "Cập nhật thành công." : "Thêm mới thành công.");
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
      setMessage("Xóa thất bại: " + error.message);
    } else {
      setMessage("Đã xóa địa điểm.");
      await loadPlaces();

      if (editingPlaceId === id) {
        resetPlaceForm();
      }
    }
  }

  const filteredPlaces =
    activeTab === "all"
      ? places
      : places.filter((item) => item.category === activeTab);

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
            <h1 className="text-2xl font-bold">Trang quản trị địa điểm</h1>
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
          <div className="rounded-2xl bg-white p-4 text-sm shadow">
            {message}
          </div>
        )}

        <div className="rounded-3xl bg-white p-3 shadow">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                activeTab === "all" ? "bg-red-600 text-white" : "border text-gray-700"
              }`}
            >
              Tất cả
            </button>

            {categoryOptions.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  activeTab === item.value
                    ? "bg-red-600 text-white"
                    : "border text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
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
                placeholder="Mô tả"
                value={placeForm.description}
                onChange={handlePlaceChange}
                className="w-full rounded-2xl border px-4 py-3"
                rows={4}
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
                placeholder="Link ảnh"
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
            <h2 className="mb-4 text-xl font-bold">
              {activeTab === "all"
                ? "Danh sách địa điểm"
                : `Danh sách: ${
                    categoryOptions.find((x) => x.value === activeTab)?.label || ""
                  }`}
            </h2>

            {loadingPlaces ? (
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            ) : (
              <div className="space-y-3">
                {filteredPlaces.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border p-4"
                  >
                    <div>
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

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {item.opening_hours && <span>Giờ mở cửa: {item.opening_hours}</span>}
                        {item.ticket_price && <span>Giá vé: {item.ticket_price}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
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

                {!filteredPlaces.length && (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}