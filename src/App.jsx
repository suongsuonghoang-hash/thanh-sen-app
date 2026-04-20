import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  UtensilsCrossed,
  Map,
  Phone,
  Search,
  Star,
  Clock3,
  Navigation,
  Share2,
  Building2,
  Landmark,
  Image as ImageIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "./lib/supabase";

// Fix icon mặc định của Leaflet khi dùng với Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const tabs = [
  { id: "home", label: "Trang chủ", icon: Building2 },
  { id: "places", label: "Tham quan", icon: MapPin },
  { id: "food", label: "Ăn uống", icon: UtensilsCrossed },
  { id: "map", label: "Bản đồ", icon: Map },
  { id: "contact", label: "Liên hệ", icon: Phone },
];

const categoryMeta = {
  historical: {
    label: "Di tích lịch sử",
    icon: Landmark,
    badge: "Di tích",
  },
  tourism: {
    label: "Địa điểm du lịch",
    icon: MapPin,
    badge: "Du lịch",
  },
  food: {
    label: "Địa điểm ăn uống",
    icon: UtensilsCrossed,
    badge: "Ăn uống",
  },
  culture: {
    label: "Nhà văn hoá",
    icon: Building2,
    badge: "Văn hoá",
  },
};

export default function App() {
  const navigate = useNavigate();

  const [active, setActive] = useState("home");
  const [search, setSearch] = useState("");
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchPlaces();
  }, []);

  async function fetchPlaces() {
    setLoadingPlaces(true);

    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi tải places:", error);
      console.error("error.message =", error.message);
      console.error("error.details =", error.details);
      console.error("error.hint =", error.hint);
      console.error("error.code =", error.code);
      setPlaces([]);
    } else {
      console.log("data =", data);
      setPlaces(data || []);
    }

    setLoadingPlaces(false);
  }

  function openPlaceDetail(place) {
    navigate(`/place/${place.id}`);
  }

  function goToCategory(category) {
    setSelectedCategory(category);

    if (category === "food") {
      setActive("food");
    } else {
      setActive("places");
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPlaces = useMemo(() => {
    return places.filter((item) => {
      if (!normalizedSearch) return true;

      const name = item.name?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const address = item.address?.toLowerCase() || "";

      return (
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        address.includes(normalizedSearch)
      );
    });
  }, [places, normalizedSearch]);

  const historicalPlaces = useMemo(
    () => filteredPlaces.filter((item) => item.category === "historical"),
    [filteredPlaces]
  );

  const tourismPlaces = useMemo(
    () => filteredPlaces.filter((item) => item.category === "tourism"),
    [filteredPlaces]
  );

  const foodPlaces = useMemo(
    () => filteredPlaces.filter((item) => item.category === "food"),
    [filteredPlaces]
  );

  const culturePlaces = useMemo(
    () => filteredPlaces.filter((item) => item.category === "culture"),
    [filteredPlaces]
  );

  const stats = useMemo(
    () => ({
      historical: places.filter((item) => item.category === "historical").length,
      tourism: places.filter((item) => item.category === "tourism").length,
      food: places.filter((item) => item.category === "food").length,
      culture: places.filter((item) => item.category === "culture").length,
    }),
    [places]
  );

  const visibleHistoricalPlaces =
    selectedCategory === "all" || selectedCategory === "historical"
      ? historicalPlaces
      : [];

  const visibleTourismPlaces =
    selectedCategory === "all" || selectedCategory === "tourism"
      ? tourismPlaces
      : [];

  const visibleCulturePlaces =
    selectedCategory === "all" || selectedCategory === "culture"
      ? culturePlaces
      : [];

  const visibleFoodPlaces =
    selectedCategory === "all" || selectedCategory === "food"
      ? foodPlaces
      : [];

  useEffect(() => {
    console.log("places:", places);
    console.log("historicalPlaces:", historicalPlaces);
  }, [places, historicalPlaces]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-white p-4">
      <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl">
        <Header />

        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm địa điểm..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="min-h-[560px] px-4 py-4">
          {active === "home" && (
            <Home
              goToCategory={goToCategory}
              stats={stats}
              loading={loadingPlaces}
              latestPlaces={filteredPlaces.slice(0, 3)}
              onOpenPlace={openPlaceDetail}
            />
          )}

          {active === "places" && (
            <Places
              loading={loadingPlaces}
              historicalItems={visibleHistoricalPlaces}
              tourismItems={visibleTourismPlaces}
              cultureItems={visibleCulturePlaces}
              selectedCategory={selectedCategory}
              clearFilter={() => setSelectedCategory("all")}
              onOpenPlace={openPlaceDetail}
            />
          )}

          {active === "food" && (
            <Food
              loading={loadingPlaces}
              items={visibleFoodPlaces}
              selectedCategory={selectedCategory}
              clearFilter={() => setSelectedCategory("all")}
              onOpenPlace={openPlaceDetail}
            />
          )}

          {active === "map" && (
            <MapSection
              loading={loadingPlaces}
              places={filteredPlaces}
              onOpenPlace={openPlaceDetail}
            />
          )}

          {active === "contact" && <Contact />}
        </div>

        <nav className="grid grid-cols-5 border-t border-gray-100 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActive(tab.id);
                  if (
                    tab.id === "home" ||
                    tab.id === "map" ||
                    tab.id === "contact"
                  ) {
                    setSelectedCategory("all");
                  }
                }}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] transition ${
                  isActive ? "text-red-600" : "text-gray-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                <span className={isActive ? "font-semibold" : "font-medium"}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="relative">
      <div
        className="h-48 w-full bg-cover bg-center"
        style={{
          backgroundImage: "url('/banner.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/80">
          Cẩm nang số
        </p>
        <h1 className="text-xl font-bold">Phường Thành Sen</h1>
        <p className="mt-1 text-xs text-white/90">
          Khám phá du lịch - ẩm thực - bản đồ số
        </p>
      </div>
    </div>
  );
}

function Home({ goToCategory, stats, loading, latestPlaces, onOpenPlace }) {
  const cards = [
    {
      label: "Di tích lịch sử",
      count: stats.historical,
      icon: Landmark,
      action: () => goToCategory("historical"),
    },
    {
      label: "Địa điểm du lịch",
      count: stats.tourism,
      icon: MapPin,
      action: () => goToCategory("tourism"),
    },
    {
      label: "Địa điểm ăn uống",
      count: stats.food,
      icon: UtensilsCrossed,
      action: () => goToCategory("food"),
    },
    {
      label: "Nhà văn hoá",
      count: stats.culture,
      icon: Building2,
      action: () => goToCategory("culture"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <section className="grid grid-cols-2 gap-3">
        {cards.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={item.action}
              className="rounded-3xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-4 text-left shadow-sm"
            >
              <div className="mb-3 inline-flex rounded-2xl bg-red-100 p-2 text-red-600">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {loading ? "Đang tải..." : `${item.count} địa điểm`}
              </p>
            </motion.button>
          );
        })}
      </section>

      <section className="rounded-3xl bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">
            Tin tức & sự kiện nổi bật
          </h2>
          <span className="text-xs text-red-600">Xem nhanh</span>
        </div>

        {loading ? (
          <EmptyState text="Đang tải dữ liệu..." />
        ) : latestPlaces.length ? (
          <div className="space-y-3">
            {latestPlaces.map((item) => {
              const meta = categoryMeta[item.category] || categoryMeta.tourism;
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenPlace(item)}
                  className="block w-full text-left"
                >
                  <HighlightItem
                    title={item.name}
                    subtitle={item.description || meta.label}
                    icon={meta.icon}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Chưa có tin tức hoặc sự kiện." />
        )}
      </section>
    </motion.div>
  );
}

function Places({
  loading,
  historicalItems,
  tourismItems,
  cultureItems,
  selectedCategory,
  clearFilter,
  onOpenPlace,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <SectionTitle
          title="Điểm tham quan"
          subtitle="Đang tải dữ liệu từ bảng places"
        />
        <EmptyState text="Đang tải dữ liệu..." />
      </div>
    );
  }

  const isAll = selectedCategory === "all";

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Điểm tham quan"
        subtitle="Hiển thị theo nhóm từ bảng places"
      />

      {selectedCategory !== "all" && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3 text-sm">
          <span>Đang lọc: {categoryMeta[selectedCategory]?.label}</span>
          <button onClick={clearFilter} className="font-semibold text-red-600">
            Xem tất cả
          </button>
        </div>
      )}

      {(isAll || selectedCategory === "historical") && (
        <CategoryBlock
          title="Di tích lịch sử"
          items={historicalItems}
          onOpenPlace={onOpenPlace}
        />
      )}

      {(isAll || selectedCategory === "tourism") && (
        <CategoryBlock
          title="Địa điểm du lịch"
          items={tourismItems}
          onOpenPlace={onOpenPlace}
        />
      )}

      {(isAll || selectedCategory === "culture") && (
        <CategoryBlock
          title="Nhà văn hoá"
          items={cultureItems}
          onOpenPlace={onOpenPlace}
        />
      )}
    </div>
  );
}

function Food({ loading, items, selectedCategory, clearFilter, onOpenPlace }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <SectionTitle
          title="Địa điểm ăn uống"
          subtitle="Dữ liệu lấy từ bảng places"
        />
        <EmptyState text="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Địa điểm ăn uống"
        subtitle="Danh sách địa điểm ăn uống từ bảng places"
      />

      {selectedCategory !== "all" && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3 text-sm">
          <span>Đang lọc: {categoryMeta[selectedCategory]?.label}</span>
          <button onClick={clearFilter} className="font-semibold text-red-600">
            Xem tất cả
          </button>
        </div>
      )}

      {items.length ? (
        items.map((item) => (
          <PlaceCard key={item.id} item={item} onOpen={onOpenPlace} />
        ))
      ) : (
        <EmptyState text="Chưa có dữ liệu địa điểm ăn uống." />
      )}
    </div>
  );
}

function CategoryBlock({ title, items, onOpenPlace }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {items.length ? (
        items.map((item) => (
          <PlaceCard key={item.id} item={item} onOpen={onOpenPlace} />
        ))
      ) : (
        <EmptyState text={`Chưa có dữ liệu ${title.toLowerCase()}.`} />
      )}
    </div>
  );
}

function PlaceCard({ item, onOpen }) {
  const meta = categoryMeta[item.category] || categoryMeta.tourism;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-block rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
            {meta.badge}
          </div>
          <button
            onClick={() => onOpen(item)}
            className="block text-left text-sm font-bold leading-6 text-gray-800 hover:text-red-600"
          >
            {item.name}
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-current" />
          4.8
        </div>
      </div>

      <p className="text-xs leading-6 text-gray-500">
        {item.description || "Chưa có mô tả."}
      </p>

      {(item.address || item.opening_hours || item.ticket_price) && (
        <div className="mt-3 space-y-1 text-[11px] text-gray-500">
          {item.address && <p>Địa chỉ: {item.address}</p>}
          {item.opening_hours && <p>Giờ mở cửa: {item.opening_hours}</p>}
          {item.ticket_price && <p>Giá vé: {item.ticket_price}</p>}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniAction icon={Navigation} label="Chỉ đường" href={item.map} />
        <MiniAction icon={ImageIcon} label="Chi tiết" onClick={() => onOpen(item)} />
        <MiniAction icon={Share2} label="Chia sẻ" />
      </div>
    </motion.div>
  );
}

function MapSection({ loading, places, onOpenPlace }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SectionTitle
          title="Bản đồ số"
          subtitle="Đang tải dữ liệu từ bảng places..."
        />
        <div className="rounded-[1.75rem] border border-red-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Đang tải bản đồ...
        </div>
      </div>
    );
  }

  if (!places.length) {
    return (
      <div className="space-y-4">
        <SectionTitle
          title="Bản đồ số"
          subtitle="Chưa có dữ liệu điểm hiển thị"
        />
        <EmptyState text="Chưa có dữ liệu trong bảng places." />
      </div>
    );
  }

  const center = [Number(places[0].lat), Number(places[0].lng)];

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Bản đồ số"
        subtitle="Hiển thị các địa điểm từ bảng places"
      />

      <div className="overflow-hidden rounded-[1.75rem] border border-red-100 bg-white shadow-sm">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: "420px", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup chunkedLoading>
            {places.map((item) => (
              <Marker
                key={item.id}
                position={[Number(item.lat), Number(item.lng)]}
              >
                <Popup>
                  <div style={{ minWidth: "180px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: "6px",
                        cursor: "pointer",
                        color: "#111827",
                      }}
                      onClick={() => onOpenPlace(item)}
                    >
                      {item.name}
                    </div>

                    <div
                      style={{
                        marginBottom: "6px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {categoryMeta[item.category]?.label || "Địa điểm"}
                    </div>

                    {item.description && (
                      <div style={{ marginBottom: "8px" }}>{item.description}</div>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {item.map && (
                        <a
                          href={item.map}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#dc2626", textDecoration: "underline" }}
                        >
                          Chỉ đường
                        </a>
                      )}

                      <button
                        onClick={() => onOpenPlace(item)}
                        style={{
                          color: "#dc2626",
                          textDecoration: "underline",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <div className="rounded-3xl bg-gray-50 p-3 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <span>🏛 Di tích lịch sử</span>
          <span>📍 Địa điểm du lịch</span>
          <span>🍜 Địa điểm ăn uống</span>
          <span>🏠 Nhà văn hoá</span>
        </div>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Liên hệ - tiện ích"
        subtitle="Thông tin đơn vị quản lý và nút thao tác nhanh"
      />
      <div className="rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-800">
          UBND phường Thành Sen
        </h3>

        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <ContactRow icon={MapPin} text="Địa chỉ: Trung tâm phường Thành Sen" />
          <ContactRow icon={Phone} text="Hotline: 0123 456 789" />
          <ContactRow icon={Clock3} text="Thời gian hỗ trợ: Giờ hành chính" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ActionButton icon={Navigation} label="Chỉ đường" />
          <ActionButton icon={Share2} label="Chia sẻ" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>
    </div>
  );
}

function HighlightItem({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="rounded-2xl bg-red-50 p-2 text-red-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label }) {
  return (
    <button className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">
      <span className="flex items-center justify-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    </button>
  );
}

function MiniAction({ icon: Icon, label, href, onClick }) {
  const classes =
    "rounded-2xl border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        <span className="flex items-center justify-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick}>
      <span className="flex items-center justify-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    </button>
  );
}

function ContactRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-red-50 p-2 text-red-600">
        <Icon className="h-4 w-4" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}