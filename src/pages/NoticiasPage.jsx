import { useEffect, useState } from "react";
import { loadNewsOnce } from "../services/newsStore";

function getImageUrl(item) {
  const cover = item?.cover;

  if (Array.isArray(cover)) {
    return cover[0]?.url || cover[0]?.path || null;
  }

  if (cover && typeof cover === "object") {
    return cover.url || cover.path || null;
  }

  return (
    item?.image_url ||
    item?.thumbnail ||
    item?.image?.url ||
    (Array.isArray(item?.images) &&
      (item.images[0]?.url || item.images[0]?.image_url)) ||
    null
  );
}

export default function NoticiasPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadNewsOnce().then((data) => {
      setNews(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div
      className="page-wrapper"
      style={{ paddingTop: "80px", minHeight: "100vh" }}
    >
      <div className="container py-5">
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h1 className="display-4 fw-bold">Noticias &amp; Blog</h1>
            <p className="text-muted">Lo último del mundo tech en The Hub.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center">
            <p>No hay noticias disponibles por ahora 😿</p>
          </div>
        ) : (
          <div className="row g-4 news-grid">
            {news.map((item) => {
              const img = getImageUrl(item);

              return (
                <div key={item.id} className="col-12 col-md-6 col-lg-4">
                  <button
                    type="button"
                    className="news-card"
                    onClick={() => setSelected(item)}
                  >
                    <div className="news-card__halo" />
                    {img && (
                      <div className="news-card__thumb-wrapper">
                        <img
                          src={img}
                          alt={item.title}
                          className="news-card__thumb"
                        />
                      </div>
                    )}
                    <div className="news-card__body">
                      <small className="news-card__date">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : ""}
                      </small>
                      <h5 className="news-card__title">{item.title}</h5>
                      <p className="news-card__excerpt">
                        {item.body
                          ? item.body.substring(0, 140) + "..."
                          : "Sin descripción."}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="news-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="news-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="news-modal__halo" />
            <div className="news-modal__header">
              <small className="news-card__date">
                {selected.created_at
                  ? new Date(selected.created_at).toLocaleDateString()
                  : ""}
              </small>
              <button
                type="button"
                className="news-modal__close"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <h2 className="news-modal__title">{selected.title}</h2>

            {getImageUrl(selected) && (
              <div className="news-modal__thumb-wrapper">
                <img
                  src={getImageUrl(selected)}
                  alt={selected.title}
                  className="news-modal__thumb"
                />
              </div>
            )}

            <p className="news-modal__body">
              {selected.body || "Sin contenido disponible."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
