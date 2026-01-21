--
-- PostgreSQL database dump
--

\restrict 4YcNQmLFGDSB7RKH7zQAH3K4M7rqZP9WQPoepm9nNMh7AmU9Xju3FF8i4CaMHjx

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: Prioritas; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Prioritas" AS ENUM (
    'RENDAH',
    'NORMAL',
    'TINGGI',
    'URGENT'
);


ALTER TYPE public."Prioritas" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'PEMILIK',
    'PENGHUNI'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: StatusKamar; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusKamar" AS ENUM (
    'TERSEDIA',
    'TERISI',
    'PERBAIKAN'
);


ALTER TYPE public."StatusKamar" OWNER TO postgres;

--
-- Name: StatusLaporan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusLaporan" AS ENUM (
    'DIAJUKAN',
    'DIPROSES',
    'SELESAI',
    'DITOLAK'
);


ALTER TYPE public."StatusLaporan" OWNER TO postgres;

--
-- Name: StatusPayment; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusPayment" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'EXPIRED',
    'CANCEL'
);


ALTER TYPE public."StatusPayment" OWNER TO postgres;

--
-- Name: StatusSewa; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusSewa" AS ENUM (
    'AKTIF',
    'SELESAI',
    'DIBATALKAN'
);


ALTER TYPE public."StatusSewa" OWNER TO postgres;

--
-- Name: StatusTagihan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusTagihan" AS ENUM (
    'BELUM_LUNAS',
    'LUNAS',
    'JATUH_TEMPO'
);


ALTER TYPE public."StatusTagihan" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barang (
    id integer NOT NULL,
    id_nama_barang integer NOT NULL,
    kategori_id integer NOT NULL,
    kondisi character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.barang OWNER TO postgres;

--
-- Name: barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.barang_id_seq OWNER TO postgres;

--
-- Name: barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barang_id_seq OWNED BY public.barang.id;


--
-- Name: fasilitas_kamar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fasilitas_kamar (
    id integer NOT NULL,
    kamar_id integer NOT NULL,
    nama_fasilitas character varying(255) NOT NULL,
    jumlah integer DEFAULT 1,
    kondisi character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fasilitas_kamar OWNER TO postgres;

--
-- Name: fasilitas_kamar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fasilitas_kamar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fasilitas_kamar_id_seq OWNER TO postgres;

--
-- Name: fasilitas_kamar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fasilitas_kamar_id_seq OWNED BY public.fasilitas_kamar.id;


--
-- Name: foto_kamar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.foto_kamar (
    id integer NOT NULL,
    kamar_id integer NOT NULL,
    foto text NOT NULL,
    caption character varying(255),
    is_primary boolean DEFAULT false NOT NULL,
    urutan integer DEFAULT 0,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.foto_kamar OWNER TO postgres;

--
-- Name: foto_kamar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.foto_kamar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.foto_kamar_id_seq OWNER TO postgres;

--
-- Name: foto_kamar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.foto_kamar_id_seq OWNED BY public.foto_kamar.id;


--
-- Name: inventori_kamar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventori_kamar (
    id integer NOT NULL,
    kamar_id integer NOT NULL,
    barang_id integer NOT NULL,
    jumlah integer DEFAULT 1,
    kondisi character varying(50),
    catatan text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventori_kamar OWNER TO postgres;

--
-- Name: inventori_kamar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventori_kamar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventori_kamar_id_seq OWNER TO postgres;

--
-- Name: inventori_kamar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventori_kamar_id_seq OWNED BY public.inventori_kamar.id;


--
-- Name: kamar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kamar (
    id integer NOT NULL,
    nomor_kamar character varying(50),
    nama_kamar character varying(255) NOT NULL,
    kategori_id integer,
    harga_per_bulan numeric(15,2),
    harga_per_harian numeric(15,2),
    luas_kamar integer,
    status public."StatusKamar" DEFAULT 'TERSEDIA'::public."StatusKamar" NOT NULL,
    deskripsi text,
    stok_kamar integer DEFAULT 1,
    lantai integer,
    fasilitas_kamar text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.kamar OWNER TO postgres;

--
-- Name: kamar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kamar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kamar_id_seq OWNER TO postgres;

--
-- Name: kamar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kamar_id_seq OWNED BY public.kamar.id;


--
-- Name: kategori_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategori_barang (
    id integer NOT NULL,
    nama_kategori character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kategori_barang OWNER TO postgres;

--
-- Name: kategori_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategori_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kategori_barang_id_seq OWNER TO postgres;

--
-- Name: kategori_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategori_barang_id_seq OWNED BY public.kategori_barang.id;


--
-- Name: kategori_kamar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategori_kamar (
    id integer NOT NULL,
    id_kost integer,
    nama_kategori character varying(255) NOT NULL,
    deskripsi text,
    harga_dasar numeric(15,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kategori_kamar OWNER TO postgres;

--
-- Name: kategori_kamar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategori_kamar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kategori_kamar_id_seq OWNER TO postgres;

--
-- Name: kategori_kamar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategori_kamar_id_seq OWNED BY public.kategori_kamar.id;


--
-- Name: laporan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laporan (
    id integer NOT NULL,
    user_id integer NOT NULL,
    kamar_id integer NOT NULL,
    jenis_laporan character varying(100),
    judul character varying(255) NOT NULL,
    isi_laporan text,
    prioritas public."Prioritas" DEFAULT 'NORMAL'::public."Prioritas" NOT NULL,
    status public."StatusLaporan" DEFAULT 'DIAJUKAN'::public."StatusLaporan" NOT NULL,
    tanggal_selesai date,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.laporan OWNER TO postgres;

--
-- Name: laporan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laporan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.laporan_id_seq OWNER TO postgres;

--
-- Name: laporan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laporan_id_seq OWNED BY public.laporan.id;


--
-- Name: nama_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nama_barang (
    id integer NOT NULL,
    id_kategori integer NOT NULL,
    nama_barang character varying(255) NOT NULL
);


ALTER TABLE public.nama_barang OWNER TO postgres;

--
-- Name: nama_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nama_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nama_barang_id_seq OWNER TO postgres;

--
-- Name: nama_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nama_barang_id_seq OWNED BY public.nama_barang.id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id integer NOT NULL,
    kode_pembayaran character varying(100) NOT NULL,
    tagihan_id integer NOT NULL,
    user_id integer NOT NULL,
    riwayat_sewa_id integer NOT NULL,
    payment_method character varying(100),
    payment_gateway character varying(100),
    gross_amount numeric(15,2) NOT NULL,
    status public."StatusPayment" DEFAULT 'PENDING'::public."StatusPayment" NOT NULL,
    transaction_id character varying(255),
    va_number character varying(255),
    bank character varying(50),
    snap_token text,
    snap_redirect_url text,
    paid_at timestamp(3) without time zone,
    verified_by integer,
    verified_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- Name: payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_id_seq OWNER TO postgres;

--
-- Name: payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_id_seq OWNED BY public.payment.id;


--
-- Name: riwayat_sewa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.riwayat_sewa (
    id integer NOT NULL,
    kode_sewa character varying(100) NOT NULL,
    user_id integer NOT NULL,
    kamar_id integer NOT NULL,
    tanggal_mulai date NOT NULL,
    tanggal_berakhir date NOT NULL,
    durasi_bulan integer,
    harga_sewa numeric(15,2),
    deposit numeric(15,2),
    status public."StatusSewa" DEFAULT 'AKTIF'::public."StatusSewa" NOT NULL,
    catatan text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.riwayat_sewa OWNER TO postgres;

--
-- Name: riwayat_sewa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.riwayat_sewa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.riwayat_sewa_id_seq OWNER TO postgres;

--
-- Name: riwayat_sewa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.riwayat_sewa_id_seq OWNED BY public.riwayat_sewa.id;


--
-- Name: tagihan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tagihan (
    id integer NOT NULL,
    nomor_tagihan character varying(100) NOT NULL,
    riwayat_sewa_id integer NOT NULL,
    user_id integer NOT NULL,
    jenis_tagihan character varying(50),
    nominal numeric(15,2) NOT NULL,
    tanggal_jatuh_tempo date NOT NULL,
    status public."StatusTagihan" DEFAULT 'BELUM_LUNAS'::public."StatusTagihan" NOT NULL,
    keterangan text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tagihan OWNER TO postgres;

--
-- Name: tagihan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tagihan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tagihan_id_seq OWNER TO postgres;

--
-- Name: tagihan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tagihan_id_seq OWNED BY public.tagihan.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255) NOT NULL,
    no_telepon character varying(50),
    password character varying(255) NOT NULL,
    role public."Role" DEFAULT 'PENGHUNI'::public."Role" NOT NULL,
    token character varying(255),
    is_active boolean DEFAULT false NOT NULL,
    verification_token character varying(255),
    email_verified_at timestamp(3) without time zone,
    reset_password_token character varying(255),
    reset_password_expires_at timestamp(3) without time zone,
    foto_profil text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang ALTER COLUMN id SET DEFAULT nextval('public.barang_id_seq'::regclass);


--
-- Name: fasilitas_kamar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fasilitas_kamar ALTER COLUMN id SET DEFAULT nextval('public.fasilitas_kamar_id_seq'::regclass);


--
-- Name: foto_kamar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foto_kamar ALTER COLUMN id SET DEFAULT nextval('public.foto_kamar_id_seq'::regclass);


--
-- Name: inventori_kamar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventori_kamar ALTER COLUMN id SET DEFAULT nextval('public.inventori_kamar_id_seq'::regclass);


--
-- Name: kamar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kamar ALTER COLUMN id SET DEFAULT nextval('public.kamar_id_seq'::regclass);


--
-- Name: kategori_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_barang ALTER COLUMN id SET DEFAULT nextval('public.kategori_barang_id_seq'::regclass);


--
-- Name: kategori_kamar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_kamar ALTER COLUMN id SET DEFAULT nextval('public.kategori_kamar_id_seq'::regclass);


--
-- Name: laporan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan ALTER COLUMN id SET DEFAULT nextval('public.laporan_id_seq'::regclass);


--
-- Name: nama_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nama_barang ALTER COLUMN id SET DEFAULT nextval('public.nama_barang_id_seq'::regclass);


--
-- Name: payment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment ALTER COLUMN id SET DEFAULT nextval('public.payment_id_seq'::regclass);


--
-- Name: riwayat_sewa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_sewa ALTER COLUMN id SET DEFAULT nextval('public.riwayat_sewa_id_seq'::regclass);


--
-- Name: tagihan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan ALTER COLUMN id SET DEFAULT nextval('public.tagihan_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cb7deb7b-4207-4f64-a5d7-a226dcbac2c3	7be5246696588d612df2482324815fc7d3e16d81ecd9509eaf21c47eedc14ab0	2025-12-28 23:49:31.463037+00	20251216224642_database_kos	\N	\N	2025-12-28 23:49:31.292449+00	1
\.


--
-- Data for Name: barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barang (id, id_nama_barang, kategori_id, kondisi, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fasilitas_kamar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fasilitas_kamar (id, kamar_id, nama_fasilitas, jumlah, kondisi, created_at) FROM stdin;
1	1	AC	1	Baik	2025-12-28 23:49:44.159
2	1	Kamar Mandi Dalam	1	Baik	2025-12-28 23:49:44.159
3	1	WiFi	1	Baik	2025-12-28 23:49:44.159
4	2	AC	1	Baik	2025-12-28 23:49:44.159
5	2	Kamar Mandi Dalam	1	Baik	2025-12-28 23:49:44.159
30	3	AC	1	Baik	2026-01-21 02:31:06.61
31	3	Kamar Mandi Dalam	1	Baik	2026-01-21 02:31:06.61
32	3	TV LED	1	Baik	2026-01-21 02:31:06.61
33	3	Balkon	1	Baik	2026-01-21 02:31:06.61
34	4	AC	1	Baik	2026-01-21 02:31:22.144
35	4	Kamar Mandi Dalam	1	Baik	2026-01-21 02:31:22.144
36	4	Dapur Kecil	1	Baik	2026-01-21 02:31:22.144
37	4	Ruang Tamu	1	Baik	2026-01-21 02:31:22.144
\.


--
-- Data for Name: foto_kamar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.foto_kamar (id, kamar_id, foto, caption, is_primary, urutan, created_at) FROM stdin;
2	4	/uploads/rooms/fotoKamar-1768962575626-100186566.webp	\N	t	0	2026-01-21 02:29:35.831
3	3	/uploads/rooms/fotoKamar-1768962666707-544105601.webp	\N	t	0	2026-01-21 02:31:06.725
4	4	/uploads/rooms/fotoKamar-1768962682197-603588823.webp	\N	t	0	2026-01-21 02:31:22.215
\.


--
-- Data for Name: inventori_kamar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventori_kamar (id, kamar_id, barang_id, jumlah, kondisi, catatan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kamar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kamar (id, nomor_kamar, nama_kamar, kategori_id, harga_per_bulan, harga_per_harian, luas_kamar, status, deskripsi, stok_kamar, lantai, fasilitas_kamar, created_at, updated_at, deleted_at) FROM stdin;
1	A101	Kamar Standard A101	1	1500000.00	\N	12	TERISI	Kamar nyaman dengan jendela menghadap taman	1	1	\N	2025-12-28 23:49:44.138	2025-12-28 23:49:44.138	\N
2	A102	Kamar Standard A102	1	1500000.00	\N	12	TERSEDIA	Kamar nyaman dengan AC dan kamar mandi dalam	1	1	\N	2025-12-28 23:49:44.144	2026-01-14 06:50:19.97	\N
3	B201	Kamar Deluxe B201	2	2500000.00	1.00	20	TERISI	Kamar luas dengan balkon pribadi	1	2	\N	2025-12-28 23:49:44.149	2026-01-21 02:31:06.604	\N
4	C301	Kamar Suite C301	3	4000000.00	1.00	30	TERISI	Kamar suite dengan ruang tamu dan dapur kecil	1	3	\N	2025-12-28 23:49:44.154	2026-01-21 02:31:22.132	\N
\.


--
-- Data for Name: kategori_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kategori_barang (id, nama_kategori, created_at) FROM stdin;
1	Elektronik	2025-12-28 23:49:44.164
2	Furniture	2025-12-28 23:49:44.167
3	Perabotan	2025-12-28 23:49:44.17
\.


--
-- Data for Name: kategori_kamar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kategori_kamar (id, id_kost, nama_kategori, deskripsi, harga_dasar, created_at, updated_at) FROM stdin;
1	\N	Standard	Kamar standard dengan fasilitas dasar	1500000.00	2025-12-28 23:49:44.127	2025-12-28 23:49:44.127
2	\N	Deluxe	Kamar deluxe dengan fasilitas lengkap	2500000.00	2025-12-28 23:49:44.132	2025-12-28 23:49:44.132
3	\N	Suite	Kamar suite premium dengan fasilitas mewah	4000000.00	2025-12-28 23:49:44.135	2025-12-28 23:49:44.135
\.


--
-- Data for Name: laporan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laporan (id, user_id, kamar_id, jenis_laporan, judul, isi_laporan, prioritas, status, tanggal_selesai, created_at, updated_at) FROM stdin;
1	2	1	\N	AC Tidak Dingin	AC di kamar tidak mengeluarkan udara dingin, sudah 2 hari tidak berfungsi dengan baik.	TINGGI	DIAJUKAN	\N	2025-12-28 23:49:44.197	2025-12-28 23:49:44.197
2	3	3	\N	Keran Bocor	Keran di kamar mandi bocor kecil, perlu diganti.	NORMAL	DIPROSES	\N	2025-12-28 23:49:44.201	2025-12-28 23:49:44.201
\.


--
-- Data for Name: nama_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nama_barang (id, id_kategori, nama_barang) FROM stdin;
1	1	AC
2	1	TV LED
3	1	Kulkas
4	2	Kasur
5	2	Lemari
6	2	Meja Belajar
7	3	Shower
8	3	Cermin
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment (id, kode_pembayaran, tagihan_id, user_id, riwayat_sewa_id, payment_method, payment_gateway, gross_amount, status, transaction_id, va_number, bank, snap_token, snap_redirect_url, paid_at, verified_by, verified_at, created_at, updated_at) FROM stdin;
1	PAY-MKD29205-F5GF	3	5	3	bank_transfer	Midtrans	4000000.00	SUCCESS	38114250-32bc-47dd-ab6a-a814942a487e	\N	\N	c211ea3b-db9d-49db-afcd-306c1d2d2d59	https://app.sandbox.midtrans.com/snap/v4/redirection/c211ea3b-db9d-49db-afcd-306c1d2d2d59	2026-01-13 20:45:20.4	\N	\N	2026-01-13 20:44:59.21	2026-01-13 20:45:20.401
2	PAY-MKD2B69C-JB1J	4	5	4	bank_transfer	Midtrans	1500000.00	SUCCESS	e09e7c1a-0404-4d10-97f7-03e023192461	\N	\N	b4458f07-c5b0-428c-84b6-780291814e06	https://app.sandbox.midtrans.com/snap/v4/redirection/b4458f07-c5b0-428c-84b6-780291814e06	2026-01-13 20:46:53.524	\N	\N	2026-01-13 20:46:37.912	2026-01-13 20:46:53.525
4	PAY-MKDHPRF3-SE8S	5	5	5	bank_transfer	Midtrans	1451613.00	SUCCESS	b670bf29-2d44-489b-9535-1fac2feb8694	\N	\N	6ccc111c-8274-431c-ac2b-3b4f86153848	https://app.sandbox.midtrans.com/snap/v4/redirection/6ccc111c-8274-431c-ac2b-3b4f86153848	2026-01-14 03:58:15.192	\N	\N	2026-01-14 03:57:52.869	2026-01-14 03:58:15.194
3	PAY-MKDHPKOG-OT70	5	5	5	echannel	Midtrans	1451613.00	CANCEL	c6b6cc5c-ff5b-4d9c-bef0-8a9139c5c2ea	\N	\N	2eaf1847-bbde-4233-a969-2dbff1473af6	https://app.sandbox.midtrans.com/snap/v4/redirection/2eaf1847-bbde-4233-a969-2dbff1473af6	\N	\N	\N	2026-01-14 03:57:44.087	2026-01-14 04:01:41.27
5	PAY-MKDHWF6W-LNE6	6	5	6	\N	\N	4000000.00	CANCEL	\N	\N	\N	47aaad7c-02a9-4836-a3ff-ac3014098a15	https://app.sandbox.midtrans.com/snap/v4/redirection/47aaad7c-02a9-4836-a3ff-ac3014098a15	\N	\N	\N	2026-01-14 04:03:04.869	2026-01-14 04:03:17.581
6	PAY-MKDHXBKC-7ZIB	7	5	7	bank_transfer	Midtrans	1500000.00	SUCCESS	e6f54d7f-5b04-47da-922c-a90313b02649	\N	\N	9309a3de-63fa-4df0-967c-271a3199cff3	https://app.sandbox.midtrans.com/snap/v4/redirection/9309a3de-63fa-4df0-967c-271a3199cff3	2026-01-14 04:04:25.969	\N	\N	2026-01-14 04:03:47.552	2026-01-14 04:04:25.971
7	PAY-MKDHZ9KA-PT2A	8	5	8	bank_transfer	Midtrans	1451613.00	SUCCESS	d1719cf9-0ce2-47ee-b5c8-27bc98aaea12	\N	\N	ed857dec-e710-43db-bdeb-a104b9aa6f10	https://app.sandbox.midtrans.com/snap/v4/redirection/ed857dec-e710-43db-bdeb-a104b9aa6f10	2026-01-14 04:06:06.825	\N	\N	2026-01-14 04:05:17.884	2026-01-14 04:06:06.826
8	PAY-MKDIBUXP-PF0N	9	5	10	bank_transfer	Midtrans	2583333.00	SUCCESS	ddde3c6c-1cc7-40be-81ec-afce08a82d9c	\N	\N	9df981b6-0fe1-4f6c-83a1-53e61a684f1c	https://app.sandbox.midtrans.com/snap/v4/redirection/9df981b6-0fe1-4f6c-83a1-53e61a684f1c	2026-01-14 04:15:23.561	\N	\N	2026-01-14 04:15:03.76	2026-01-14 04:15:23.563
\.


--
-- Data for Name: riwayat_sewa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.riwayat_sewa (id, kode_sewa, user_id, kamar_id, tanggal_mulai, tanggal_berakhir, durasi_bulan, harga_sewa, deposit, status, catatan, created_at, updated_at) FROM stdin;
1	SEWA-1766965784178-001	2	1	2024-01-01	2024-12-31	12	1500000.00	3000000.00	AKTIF	\N	2025-12-28 23:49:44.179	2025-12-28 23:49:44.179
2	SEWA-1766965784182-002	3	3	2024-03-01	2025-02-28	12	2500000.00	5000000.00	AKTIF	\N	2025-12-28 23:49:44.183	2025-12-28 23:49:44.183
3	SWA-MKD291YV-86B6	5	4	2026-01-13	2026-01-13	1	4000000.00	\N	SELESAI	\N	2026-01-13 20:44:58.81	2026-01-13 20:45:49.659
4	SWA-MKD2B674-WYUB	5	2	2026-01-13	2026-01-14	1	1500000.00	\N	SELESAI	Pindah ke kamar Kamar Suite C301 pada 14/1/2026	2026-01-13 20:46:37.601	2026-01-14 03:56:47.438
5	SWA-MKDHOD79-TN26	5	4	2026-01-14	2026-01-14	1	4000000.00	\N	DIBATALKAN	Pindahan dari kamar Kamar Standard A102	2026-01-14 03:56:47.446	2026-01-14 04:01:41.279
6	SWA-MKDHWF5T-AX7N	5	4	2026-01-14	2026-01-14	1	4000000.00	\N	DIBATALKAN	\N	2026-01-14 04:03:03.234	2026-01-14 04:03:17.588
7	SWA-MKDHXBHY-Y6BO	5	2	2026-01-14	2026-01-14	1	1500000.00	\N	SELESAI	Pindah ke kamar Kamar Suite C301 pada 14/1/2026	2026-01-14 04:03:45.144	2026-01-14 04:05:08.922
8	SWA-MKDHZ45C-WNZY	5	4	2026-01-14	2026-01-14	1	4000000.00	\N	SELESAI	Pindah ke kamar Kamar Standard A102 pada 14/1/2026	2026-01-14 04:05:08.929	2026-01-14 04:06:27.165
9	SWA-MKDI0SIO-OQY2	5	2	2026-01-14	2026-01-14	1	1500000.00	\N	SELESAI	Pindah ke kamar Kamar Suite C301 pada 14/1/2026	2026-01-14 04:06:27.169	2026-01-14 04:14:48.545
10	SWA-MKDIBJE1-PAHV	5	4	2026-01-14	2026-01-14	1	4000000.00	\N	SELESAI	Pindah ke kamar Kamar Standard A102 pada 14/1/2026	2026-01-14 04:14:48.555	2026-01-14 06:50:14.357
11	SWA-MKDNVF8F-P7BG	5	2	2026-01-14	2026-01-14	1	1500000.00	\N	SELESAI	Pindah ke kamar Kamar Suite C301 pada 14/1/2026	2026-01-14 06:50:14.368	2026-01-14 06:50:19.966
12	SWA-MKDNVJK7-8BYK	5	4	2026-01-14	2026-02-14	1	4000000.00	\N	AKTIF	Pindahan dari kamar Kamar Standard A102	2026-01-14 06:50:19.976	2026-01-14 06:50:19.976
\.


--
-- Data for Name: tagihan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tagihan (id, nomor_tagihan, riwayat_sewa_id, user_id, jenis_tagihan, nominal, tanggal_jatuh_tempo, status, keterangan, created_at, updated_at) FROM stdin;
1	TGH-1766965784185-001	1	2	SEWA_BULANAN	1500000.00	2026-01-10	BELUM_LUNAS	Tagihan sewa bulan Desember 2024	2025-12-28 23:49:44.185	2025-12-28 23:49:44.185
2	TGH-1766965784189-002	2	3	SEWA_BULANAN	2500000.00	2026-01-10	BELUM_LUNAS	Tagihan sewa bulan Desember 2024	2025-12-28 23:49:44.19	2025-12-28 23:49:44.19
3	TGH-MKD291Z8-GX5E	3	5	SEWA	4000000.00	2026-01-14	LUNAS	Pembayaran sewa kamar Kamar Suite C301 untuk 1 bulan	2026-01-13 20:44:58.821	2026-01-13 20:45:20.448
4	TGH-MKD2B67A-3GC0	4	5	SEWA	1500000.00	2026-01-14	LUNAS	Pembayaran sewa kamar Kamar Standard A102 untuk 1 bulan	2026-01-13 20:46:37.607	2026-01-13 20:46:53.574
5	TGH-MKDHOD7I-I9NA	5	5	SELISIH_PINDAH_KAMAR	1451613.00	2026-01-21	JATUH_TEMPO	Selisih harga pindah kamar dari Kamar Standard A102 ke Kamar Suite C301 (18 hari sisa bulan ini)	2026-01-14 03:56:47.455	2026-01-14 04:01:41.275
6	TGH-MKDHWF62-K9FT	6	5	SEWA	4000000.00	2026-01-15	JATUH_TEMPO	Pembayaran sewa kamar Kamar Suite C301 untuk 1 bulan	2026-01-14 04:03:03.243	2026-01-14 04:03:17.584
7	TGH-MKDHXBI6-KE39	7	5	SEWA	1500000.00	2026-01-15	LUNAS	Pembayaran sewa kamar Kamar Standard A102 untuk 1 bulan	2026-01-14 04:03:45.151	2026-01-14 04:04:26.021
8	TGH-MKDHZ45H-IGM5	8	5	SELISIH_PINDAH_KAMAR	1451613.00	2026-01-21	LUNAS	Selisih harga pindah kamar dari Kamar Standard A102 ke Kamar Suite C301 (18 hari sisa bulan ini)	2026-01-14 04:05:08.934	2026-01-14 04:06:06.878
9	TGH-MKDIBJE6-SA1Q	10	5	SELISIH_PINDAH_KAMAR	2583333.00	2026-01-21	LUNAS	Selisih harga pindah kamar dari Kamar Standard A102 ke Kamar Suite C301 (31 hari sisa periode sewa s/d 14/2/2026)	2026-01-14 04:14:48.559	2026-01-14 04:15:23.574
10	TGH-MKDNVJKF-0QF5	12	5	SELISIH_PINDAH_KAMAR	2583333.00	2026-01-15	BELUM_LUNAS	Selisih harga pindah kamar dari Kamar Standard A102 ke Kamar Suite C301 (31 hari sisa periode sewa s/d 14/2/2026)	2026-01-14 06:50:19.985	2026-01-14 06:50:19.985
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, no_telepon, password, role, token, is_active, verification_token, email_verified_at, reset_password_token, reset_password_expires_at, foto_profil, created_at, updated_at, deleted_at) FROM stdin;
3	Siti Aminah	penghuni2@example.com	08222333444	$2a$12$Y5mkMCNb8Ie./WMRU2RPXeJSkaeZ22ZJI9pktVbSZyObrdEVr5aVC	PENGHUNI	\N	t	\N	2025-12-28 23:49:44.121	\N	\N	\N	2025-12-28 23:49:44.122	2025-12-28 23:49:44.122	\N
5	nata	nata@kostmanagement.com		$2a$12$D27yvS/kVTyUSC629OlqpuiKTpU6Jv4VXaYSBE.pvwfx07LYgi6Nq	PENGHUNI	\N	t	\N	2026-01-13 20:40:48.661	\N	\N	\N	2026-01-13 20:40:48.663	2026-01-21 02:28:47.934	\N
1	Admin Kost	admin@kostmanagement.com	08123456789	$2a$12$uXIfk05Lwjr80xVhaGEBP.Sm6H/5YWSRNptOB97UwD6CnDCHSUeBi	PEMILIK	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJQRU1JTElLIiwiaWF0IjoxNzY4OTYyNTUzLCJleHAiOjE3Njk1NjczNTN9.9lLEW3bHIaH9_zRMk8KMXeJjIQGSn2eYuvRxOIvTttA	t	\N	2025-12-28 23:49:43.589	\N	\N	\N	2025-12-28 23:49:43.618	2026-01-21 02:29:13.206	\N
2	Budi Santoso	penghuni1@example.com	08111222333	$2a$12$BN1fSOYaZQlI5jsgIt.DnOYCOw1I2UkpL6ej7MVTW3dbrBPE.RBge	PENGHUNI	\N	t	\N	2025-12-28 23:49:43.87	\N	\N	\N	2025-12-28 23:49:43.871	2026-01-13 20:37:34.602	\N
4	nana	nana@kostmanagement.com		$2a$12$0tyYHZeRUJu5/y6CXHckTe/DNpREEZRmvE.Q98LHOlbXX86KVQdSG	PEMILIK	\N	t	\N	2025-12-28 23:58:35.314	\N	\N	\N	2025-12-28 23:58:35.315	2026-01-13 20:38:52.756	\N
7	Nandana Ayudya Natasaskara	nandana@students.amikom.ac.id	085227727700	$2a$12$JMIaWMw6lDY1PthrwniLGewubwiPLNglzLnOeYhYbvOzvnwJ7cLUa	PENGHUNI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInJvbGUiOiJQRU5HSFVOSSIsImlhdCI6MTc2ODMzODQzNywiZXhwIjoxNzY4OTQzMjM3fQ.SI9uwKQskjAYYaDp_XRNIUYSDBHeCnNqbCI7TbYel5k	t	e9a3727eceafefa7c7ee0d444c1c2f2775de9870d8d45df20872c4bec0fef9ff	\N	\N	\N	\N	2026-01-13 21:04:28.818	2026-01-13 21:07:17.428	\N
6	Nandana Ayudya Natasaskara	nandananatasakara@gmail.com	085227727700	$2a$12$/vtitLom/sZEpbfHUaVV3.5M5T6Q7bv1B5QhUhMoLonKzpYC/8fs.	PENGHUNI	\N	t	\N	2026-01-13 21:03:14.947	\N	\N	\N	2026-01-13 21:02:58.586	2026-01-13 21:14:32.428	\N
\.


--
-- Name: barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barang_id_seq', 1, false);


--
-- Name: fasilitas_kamar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fasilitas_kamar_id_seq', 37, true);


--
-- Name: foto_kamar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.foto_kamar_id_seq', 4, true);


--
-- Name: inventori_kamar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventori_kamar_id_seq', 1, false);


--
-- Name: kamar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kamar_id_seq', 4, true);


--
-- Name: kategori_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategori_barang_id_seq', 3, true);


--
-- Name: kategori_kamar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategori_kamar_id_seq', 3, true);


--
-- Name: laporan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laporan_id_seq', 2, true);


--
-- Name: nama_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nama_barang_id_seq', 8, true);


--
-- Name: payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_id_seq', 8, true);


--
-- Name: riwayat_sewa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.riwayat_sewa_id_seq', 12, true);


--
-- Name: tagihan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tagihan_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: barang barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_pkey PRIMARY KEY (id);


--
-- Name: fasilitas_kamar fasilitas_kamar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fasilitas_kamar
    ADD CONSTRAINT fasilitas_kamar_pkey PRIMARY KEY (id);


--
-- Name: foto_kamar foto_kamar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foto_kamar
    ADD CONSTRAINT foto_kamar_pkey PRIMARY KEY (id);


--
-- Name: inventori_kamar inventori_kamar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventori_kamar
    ADD CONSTRAINT inventori_kamar_pkey PRIMARY KEY (id);


--
-- Name: kamar kamar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kamar
    ADD CONSTRAINT kamar_pkey PRIMARY KEY (id);


--
-- Name: kategori_barang kategori_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_barang
    ADD CONSTRAINT kategori_barang_pkey PRIMARY KEY (id);


--
-- Name: kategori_kamar kategori_kamar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_kamar
    ADD CONSTRAINT kategori_kamar_pkey PRIMARY KEY (id);


--
-- Name: laporan laporan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan
    ADD CONSTRAINT laporan_pkey PRIMARY KEY (id);


--
-- Name: nama_barang nama_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nama_barang
    ADD CONSTRAINT nama_barang_pkey PRIMARY KEY (id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- Name: riwayat_sewa riwayat_sewa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_sewa
    ADD CONSTRAINT riwayat_sewa_pkey PRIMARY KEY (id);


--
-- Name: tagihan tagihan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan
    ADD CONSTRAINT tagihan_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: kamar_nama_kamar_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX kamar_nama_kamar_key ON public.kamar USING btree (nama_kamar);


--
-- Name: kategori_barang_nama_kategori_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX kategori_barang_nama_kategori_key ON public.kategori_barang USING btree (nama_kategori);


--
-- Name: kategori_kamar_nama_kategori_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX kategori_kamar_nama_kategori_key ON public.kategori_kamar USING btree (nama_kategori);


--
-- Name: payment_kode_pembayaran_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payment_kode_pembayaran_key ON public.payment USING btree (kode_pembayaran);


--
-- Name: riwayat_sewa_kode_sewa_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX riwayat_sewa_kode_sewa_key ON public.riwayat_sewa USING btree (kode_sewa);


--
-- Name: tagihan_nomor_tagihan_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tagihan_nomor_tagihan_key ON public.tagihan USING btree (nomor_tagihan);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: barang barang_id_nama_barang_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_id_nama_barang_fkey FOREIGN KEY (id_nama_barang) REFERENCES public.nama_barang(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: barang barang_kategori_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori_barang(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fasilitas_kamar fasilitas_kamar_kamar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fasilitas_kamar
    ADD CONSTRAINT fasilitas_kamar_kamar_id_fkey FOREIGN KEY (kamar_id) REFERENCES public.kamar(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: foto_kamar foto_kamar_kamar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foto_kamar
    ADD CONSTRAINT foto_kamar_kamar_id_fkey FOREIGN KEY (kamar_id) REFERENCES public.kamar(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventori_kamar inventori_kamar_barang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventori_kamar
    ADD CONSTRAINT inventori_kamar_barang_id_fkey FOREIGN KEY (barang_id) REFERENCES public.barang(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventori_kamar inventori_kamar_kamar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventori_kamar
    ADD CONSTRAINT inventori_kamar_kamar_id_fkey FOREIGN KEY (kamar_id) REFERENCES public.kamar(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kamar kamar_kategori_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kamar
    ADD CONSTRAINT kamar_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori_kamar(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: laporan laporan_kamar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan
    ADD CONSTRAINT laporan_kamar_id_fkey FOREIGN KEY (kamar_id) REFERENCES public.kamar(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: laporan laporan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan
    ADD CONSTRAINT laporan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: nama_barang nama_barang_id_kategori_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nama_barang
    ADD CONSTRAINT nama_barang_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori_barang(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment payment_riwayat_sewa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_riwayat_sewa_id_fkey FOREIGN KEY (riwayat_sewa_id) REFERENCES public.riwayat_sewa(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment payment_tagihan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tagihan_id_fkey FOREIGN KEY (tagihan_id) REFERENCES public.tagihan(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment payment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment payment_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: riwayat_sewa riwayat_sewa_kamar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_sewa
    ADD CONSTRAINT riwayat_sewa_kamar_id_fkey FOREIGN KEY (kamar_id) REFERENCES public.kamar(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: riwayat_sewa riwayat_sewa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_sewa
    ADD CONSTRAINT riwayat_sewa_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tagihan tagihan_riwayat_sewa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan
    ADD CONSTRAINT tagihan_riwayat_sewa_id_fkey FOREIGN KEY (riwayat_sewa_id) REFERENCES public.riwayat_sewa(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tagihan tagihan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan
    ADD CONSTRAINT tagihan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 4YcNQmLFGDSB7RKH7zQAH3K4M7rqZP9WQPoepm9nNMh7AmU9Xju3FF8i4CaMHjx

