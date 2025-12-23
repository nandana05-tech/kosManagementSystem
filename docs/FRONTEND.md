# Frontend Documentation - Sistem Manajemen Kos

Dokumentasi teknis untuk frontend aplikasi menggunakan React 18, Vite, dan TailwindCSS.

## Struktur Direktori

```
frontend/
├── src/
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles
│   ├── assets/                 # Static assets
│   ├── components/             # Reusable components
│   │   ├── common/             # Generic components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── index.js            # Component exports
│   ├── pages/                  # Page components
│   │   ├── Home.jsx            # Public homepage
│   │   ├── NotFound.jsx        # 404 page
│   │   ├── auth/               # Auth pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── kamar/              # Room pages
│   │   ├── barang/             # Item pages
│   │   ├── tagihan/            # Invoice pages
│   │   ├── payment/            # Payment pages
│   │   ├── laporan/            # Report pages
│   │   ├── users/              # User management pages
│   │   └── riwayat/            # History pages
│   ├── features/               # Zustand stores
│   ├── services/               # API service modules
│   ├── hooks/                  # Custom React hooks
│   ├── routes/                 # Route definitions
│   └── utils/                  # Helper functions
├── public/                     # Static public files
├── docs/                       # Frontend-specific docs
├── Dockerfile                  # Docker config
├── nginx.conf                  # Frontend nginx config
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── package.json
```

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### npm Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Component Structure

### Component Organization

```
components/
├── common/                 # Generic, reusable components
│   ├── Button.jsx          # Button component
│   ├── Card.jsx            # Card container
│   ├── Modal.jsx           # Modal dialog
│   ├── Loading.jsx         # Loading spinner
│   ├── EmptyState.jsx      # Empty state display
│   ├── Badge.jsx           # Status badges
│   ├── Pagination.jsx      # Pagination component
│   ├── SearchInput.jsx     # Search input
│   ├── StatusBadge.jsx     # Status indicator
│   └── ConfirmModal.jsx    # Confirmation dialog
│
├── forms/                  # Form-related components
│   ├── FormInput.jsx       # Text input
│   ├── FormSelect.jsx      # Select dropdown
│   ├── FormTextarea.jsx    # Textarea
│   ├── FormCheckbox.jsx    # Checkbox
│   ├── FormRadio.jsx       # Radio buttons
│   ├── FileUpload.jsx      # File upload
│   ├── ImagePreview.jsx    # Image preview
│   └── DatePicker.jsx      # Date picker
│
└── layout/                 # Layout components
    ├── Layout.jsx          # Main layout wrapper
    ├── Navbar.jsx          # Navigation bar
    ├── Sidebar.jsx         # Sidebar menu
    └── Footer.jsx          # Footer
```

### Component Pattern

```jsx
// components/common/Button.jsx
import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props 
}, ref) => {
  const baseStyles = "rounded-lg font-medium transition-all";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
});

export default Button;
```

## Pages

### Page Organization

```
pages/
├── Home.jsx                # Public landing page
├── NotFound.jsx            # 404 error page
│
├── auth/                   # Authentication pages
│   ├── Login.jsx           # Login page
│   ├── Register.jsx        # Registration page
│   ├── VerifyEmail.jsx     # Email verification
│   ├── ForgotPassword.jsx  # Password reset request
│   └── ResetPassword.jsx   # Password reset form
│
├── dashboard/              # Dashboard pages
│   ├── Dashboard.jsx       # Main dashboard (Pemilik)
│   └── PenghuniDashboard.jsx # Penghuni dashboard
│
├── kamar/                  # Room management
│   ├── KamarList.jsx       # Room listing
│   ├── KamarDetail.jsx     # Room detail view
│   └── KamarForm.jsx       # Create/edit room
│
├── barang/                 # Item management
│   ├── BarangList.jsx      # Item listing
│   └── BarangForm.jsx      # Create/edit item
│
├── tagihan/                # Invoice management
│   ├── TagihanList.jsx     # Invoice listing
│   ├── TagihanDetail.jsx   # Invoice detail
│   └── TagihanForm.jsx     # Create/edit invoice
│
├── payment/                # Payment pages
│   ├── PaymentList.jsx     # Payment history
│   ├── PaymentFinish.jsx   # Payment success page
│   └── PaymentError.jsx    # Payment error page
│
├── laporan/                # Report management
│   ├── LaporanList.jsx     # Report listing
│   ├── LaporanDetail.jsx   # Report detail
│   └── LaporanForm.jsx     # Create report
│
├── users/                  # User management
│   ├── UserList.jsx        # User listing
│   └── Profile.jsx         # User profile
│
└── riwayat/                # History pages
    └── RiwayatList.jsx     # Rental history
```

### Page Pattern

```jsx
// pages/kamar/KamarList.jsx
import { useEffect } from 'react';
import { useKamarStore } from '../../features/kamar/kamarStore';
import { Card, Loading, EmptyState } from '../../components';

const KamarList = () => {
  // 1. Access store
  const { kamarList, isLoading, fetchKamar } = useKamarStore();
  
  // 2. Fetch data on mount
  useEffect(() => {
    fetchKamar();
  }, [fetchKamar]);
  
  // 3. Handle loading state
  if (isLoading) return <Loading />;
  
  // 4. Handle empty state
  if (!kamarList.length) {
    return <EmptyState message="Belum ada kamar" />;
  }
  
  // 5. Render content
  return (
    <div className="grid gap-4">
      {kamarList.map(kamar => (
        <Card key={kamar.id}>
          {/* Card content */}
        </Card>
      ))}
    </div>
  );
};

export default KamarList;
```

## 🗄️ State Management (Zustand)

### Store Structure

```
features/
├── auth/
│   └── authStore.js        # Authentication state
├── kamar/
│   └── kamarStore.js       # Room state
├── barang/
│   └── barangStore.js      # Item/inventory state
├── tagihan/
│   └── tagihanStore.js     # Invoice state
├── laporan/
│   └── laporanStore.js     # Report state
└── users/
    └── userStore.js        # User management state
```

### Store Pattern

```javascript
// features/kamar/kamarStore.js
import { create } from 'zustand';
import kamarService from '../../services/kamar.service';

const useKamarStore = create((set, get) => ({
  // State
  kamarList: [],
  selectedKamar: null,
  isLoading: false,
  error: null,
  
  // Actions
  fetchKamar: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await kamarService.getAll(params);
      set({ kamarList: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchKamarById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await kamarService.getById(id);
      set({ selectedKamar: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  createKamar: async (data) => {
    const response = await kamarService.create(data);
    set(state => ({
      kamarList: [...state.kamarList, response.data]
    }));
    return response;
  },
  
  updateKamar: async (id, data) => {
    const response = await kamarService.update(id, data);
    set(state => ({
      kamarList: state.kamarList.map(k => 
        k.id === id ? response.data : k
      )
    }));
  },
  
  deleteKamar: async (id) => {
    await kamarService.delete(id);
    set(state => ({
      kamarList: state.kamarList.filter(k => k.id !== id)
    }));
  },
  
  // Selectors
  getAvailableKamar: () => {
    return get().kamarList.filter(k => k.status === 'TERSEDIA');
  },
  
  // Reset
  reset: () => set({ 
    kamarList: [], 
    selectedKamar: null, 
    isLoading: false, 
    error: null 
  })
}));

export default useKamarStore;
```

### Auth Store Example

```javascript
// features/auth/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../../services/auth.service';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const response = await authService.login(credentials);
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      checkAuth: async () => {
        try {
          const response = await authService.me();
          set({ user: response.data, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);

export default useAuthStore;
```

## API Services

### Service Structure

```
services/
├── api.js              # Axios instance configuration
├── auth.service.js     # Authentication APIs
├── user.service.js     # User management APIs
├── kamar.service.js    # Room APIs
├── barang.service.js   # Item/inventory APIs
├── tagihan.service.js  # Invoice APIs
├── payment.service.js  # Payment APIs
└── laporan.service.js  # Report APIs
```

### API Configuration

```javascript
// services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
```

### Service Pattern

```javascript
// services/kamar.service.js
import api from './api';

const kamarService = {
  getAll: (params) => api.get('/kamar', { params }),
  
  getById: (id) => api.get(`/kamar/${id}`),
  
  create: (data) => api.post('/kamar', data),
  
  update: (id, data) => api.put(`/kamar/${id}`, data),
  
  delete: (id) => api.delete(`/kamar/${id}`),
  
  uploadPhotos: (id, formData) => 
    api.post(`/kamar/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deletePhoto: (kamarId, photoId) =>
    api.delete(`/kamar/${kamarId}/photos/${photoId}`)
};

export default kamarService;
```

## Routing

### Route Configuration

```javascript
// routes/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
// ... more imports

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>
    
    {/* Protected Routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/kamar" element={<KamarList />} />
      <Route path="/kamar/:id" element={<KamarDetail />} />
      {/* ... more routes */}
    </Route>
    
    {/* Role-specific Routes */}
    <Route element={<ProtectedRoute roles={['PEMILIK']} />}>
      <Route path="/users" element={<UserList />} />
    </Route>
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
```

### Protected Route

```javascript
// routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../features/auth/authStore';

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
```

## Styling

### TailwindCSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        secondary: {
          500: '#6b7280',
          600: '#4b5563'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

### Global Styles

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg
           hover:bg-blue-700 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-100 p-6;
  }
  
  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg
           focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }
}
```

## Custom Hooks

### Available Hooks

```
hooks/
├── useDebounce.js      # Debounce input values
├── useLocalStorage.js  # Persist to localStorage
└── useClickOutside.js  # Detect clicks outside element
```

### Hook Examples

```javascript
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

export default useDebounce;
```

```javascript
// Usage
const SearchComponent = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return (
    <input 
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
};
```

## Forms

### React Hook Form Integration

```jsx
// pages/auth/Login.jsx
import { useForm } from 'react-hook-form';
import { FormInput, Button } from '../../components';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    await authService.login(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="Email"
        type="email"
        {...register('email', { 
          required: 'Email wajib diisi',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Format email tidak valid'
          }
        })}
        error={errors.email?.message}
      />
      
      <FormInput
        label="Password"
        type="password"
        {...register('password', { 
          required: 'Password wajib diisi',
          minLength: {
            value: 6,
            message: 'Password minimal 6 karakter'
          }
        })}
        error={errors.password?.message}
      />
      
      <Button type="submit">Login</Button>
    </form>
  );
};
```

## Notifications

### Toast Configuration

```jsx
// main.jsx
import { Toaster } from 'react-hot-toast';

<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#fff',
      color: '#333',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      padding: '12px 16px',
    },
    success: {
      iconTheme: { primary: '#22c55e', secondary: '#fff' }
    },
    error: {
      iconTheme: { primary: '#ef4444', secondary: '#fff' }
    }
  }}
/>
```

### Usage

```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Data berhasil disimpan');

// Error
toast.error('Terjadi kesalahan');

// Loading
const promise = saveData();
toast.promise(promise, {
  loading: 'Menyimpan...',
  success: 'Berhasil!',
  error: 'Gagal menyimpan'
});
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |

## Responsive Design

### Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| `sm` | >= 640px | Mobile landscape |
| `md` | >= 768px | Tablet |
| `lg` | >= 1024px | Desktop |
| `xl` | >= 1280px | Large desktop |

### Usage

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

## End-to-End Flow Documentation

### Complete Data Flow Pattern

Berikut adalah pola lengkap bagaimana data mengalir di frontend:

```
User Interaction
       ↓
Page Component (e.g., KamarList.jsx)
       ↓
Zustand Store (e.g., kamarStore.js)
       ↓ call action
Service Layer (e.g., kamar.service.js)
       ↓ axios request
API Interceptor (api.js)
       ↓ add auth token
Backend API (/api/kamar)
       ↓ response
API Interceptor
       ↓ extract data, handle errors
Service Layer
       ↓ return response
Zustand Store
       ↓ update state
Page Component (re-render)
       ↓
UI Update
```

### Authentication Flow (Login Page)

```
User clicks "Masuk"
       ↓
Login.jsx
├── useForm().handleSubmit(onSubmit)
├── Extract { email, password }
└── Call authStore.login(email, password)
       ↓
authStore.js (Zustand)
├── set({ isLoading: true })
├── Call authService.login(email, password)
│        ↓
│   auth.service.js
│   └── api.post('/auth/login', { email, password })
│        ↓
│   api.js (Axios interceptor)
│   └── Add headers, send request
│        ↓
│   Backend: POST /api/auth/login
│        ↓
│   Response: { success: true, data: { user, token } }
│        ↓
├── Receive response.data
├── set({ user, token, isAuthenticated: true })
└── persist to localStorage (zustand/persist)
       ↓
Login.jsx
├── toast.success('Login berhasil!')
└── navigate('/dashboard')
       ↓
React Router
├── PrivateRoute checks isAuthenticated
├── Pass → render MainLayout + Dashboard
└── Fail → redirect to /login
```

### Room Management Flow (View & Create)

#### Viewing Room List

```
User navigates to /kamar
       ↓
React Router matches route
       ↓
KamarList.jsx mounts
       ↓
useEffect(() => {
  fetchKamar();  // from kamarStore
}, []);
       ↓
kamarStore.fetchKamar()
├── set({ isLoading: true })
├── kamarService.getAll()
│        ↓
│   api.get('/kamar')
│        ↓
│   Response: { data: [kamar1, kamar2, ...] }
├── set({ kamarList: response.data })
└── set({ isLoading: false })
       ↓
KamarList.jsx re-renders
├── isLoading false → hide Loading component
├── kamarList.length > 0 → render cards
└── Map through kamarList → <Card> for each
       ↓
User sees room list
```

#### Creating New Room

```
User navigates to /kamar/new (Pemilik only)
       ↓
React Router
├── PrivateRoute → authenticated? ✓
└── RoleRoute → role === 'PEMILIK'? ✓
       ↓
KamarForm.jsx mounts (mode: create)
       ↓
useForm() initializes empty form
       ↓
User fills form + uploads photos
       ↓
User clicks "Simpan"
       ↓
handleSubmit(data)
├── Create FormData (for file upload)
├── Append all fields to FormData
└── Call kamarStore.createKamar(formData)
       ↓
kamarStore.createKamar(formData)
├── kamarService.create(formData)
│        ↓
│   api.post('/kamar', formData, {
│     headers: { 'Content-Type': 'multipart/form-data' }
│   })
│        ↓
│   Backend processes:
│   - Validate input
│   - Compress images (Sharp)
│   - Save to database
│   - Return new kamar
├── Add new kamar to kamarList
└── Return response
       ↓
KamarForm.jsx
├── toast.success('Kamar berhasil ditambahkan')
└── navigate(`/kamar/${response.data.id}`)
```

### Payment Flow (User Journey)

```
User views /tagihan (TagihanList.jsx)
       ↓
Click tagihan row → navigate to /tagihan/:id
       ↓
TagihanDetail.jsx
├── useParams() → get id
├── tagihanStore.fetchTagihanById(id)
└── Render tagihan details
       ↓
User clicks "Bayar Sekarang"
       ↓
handlePayment()
├── paymentService.create({ tagihanId })
│        ↓
│   Backend creates Midtrans transaction
│   Return: { redirectUrl, snapToken }
└── window.location.href = redirectUrl
       ↓
User redirected to Midtrans payment page
       ↓
User completes payment on Midtrans
       ↓
Midtrans redirects to /payment/finish?order_id=xxx
       ↓
PaymentFinish.jsx
├── useSearchParams() → get order_id
├── paymentService.getByOrderId(orderId)
├── Display payment result
└── Show "Kembali ke Dashboard" button
```

### Laporan Flow (Penghuni submits, Pemilik processes)

```
=== Penghuni Creates Report ===

User navigates to /laporan/new
       ↓
LaporanForm.jsx
├── Form fields: judul, deskripsi, kamarId, prioritas
├── FileUpload component for foto
└── User submits form
       ↓
handleSubmit()
├── Create FormData with all fields
├── laporanStore.createLaporan(formData)
│        ↓
│   laporanService.create(formData)
│        ↓
│   Backend:
│   - Save laporan with status: DIAJUKAN
│   - Send email to Pemilik
└── toast.success() → navigate to /laporan
       ↓

=== Pemilik Views & Updates ===

Pemilik sees notification in Navbar
       ↓
Click notification → navigate to /laporan/:id
       ↓
LaporanDetail.jsx
├── Fetch laporan details
├── Show: judul, deskripsi, foto, status
└── If role === PEMILIK: show "Update Status" section
       ↓
Pemilik selects new status + adds catatan
       ↓
handleUpdateStatus({ status: 'DIPROSES', catatan })
├── laporanService.updateStatus(id, data)
│        ↓
│   Backend:
│   - Update laporan status
│   - Send email to Penghuni
└── toast.success('Status berhasil diupdate')
```

### Component Dependency Map

```
src/
├── main.jsx ─────────────────────────────────────────┐
│   Entry point, renders App with providers           │
│   ├── React.StrictMode                              │
│   ├── BrowserRouter (React Router)                  │
│   └── Toaster (react-hot-toast)                     │
│                                                     │
├── App.jsx ──────────────────────────────────────────┤
│   └── Renders AppRoutes                             │
│                                                     │
├── routes/index.jsx ─────────────────────────────────┤
│   Route definitions with guards                     │
│   ├── PrivateRoute - auth check                     │
│   ├── RoleRoute - role check                        │
│   ├── AuthLayout - for auth pages                   │
│   └── MainLayout - for protected pages              │
│                                                     │
├── components/layout/ ───────────────────────────────┤
│   ├── MainLayout.jsx                                │
│   │   └── Wraps: Navbar + Sidebar + Outlet          │
│   ├── AuthLayout.jsx                                │
│   │   └── Wraps: Centered card + Outlet             │
│   ├── Navbar.jsx                                    │
│   │   Uses: authStore.user, logout                  │
│   │   Shows: notifications, profile dropdown        │
│   └── Sidebar.jsx                                   │
│       Uses: authStore.isPemilik()                   │
│       Shows: role-specific menu items               │
│                                                     │
├── pages/ ───────────────────────────────────────────┤
│   Each page typically:                              │
│   ├── Imports store from features/                  │
│   ├── Imports components from components/           │
│   ├── Uses hooks (useEffect, useState, useParams)   │
│   └── Calls store actions for data fetching         │
│                                                     │
├── features/ ────────────────────────────────────────┤
│   Zustand stores, each contains:                    │
│   ├── State (data, isLoading, error)                │
│   ├── Actions (fetch, create, update, delete)       │
│   └── Selectors (filtered/computed data)            │
│                                                     │
├── services/ ────────────────────────────────────────┤
│   API service modules:                              │
│   ├── api.js - Axios instance + interceptors        │
│   └── *.service.js - Domain-specific API calls      │
│                                                     │
└── components/ ──────────────────────────────────────┘
    Reusable UI components:
    ├── common/ - Button, Card, Modal, Loading, etc.
    └── forms/ - Input, Select, FileUpload, etc.
```

### State Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Pages   │───→│  Stores  │───→│ Services │      │
│  │ (React)  │←───│ (Zustand)│←───│ (Axios)  │      │
│  └──────────┘    └──────────┘    └──────────┘      │
│       ↑              ↑               │              │
│       │              │               ↓              │
│  ┌──────────┐        │         ┌──────────┐        │
│  │Components│        │         │  api.js  │        │
│  │ (common/ │        │         │Interceptor│       │
│  │  forms/) │        │         └──────────┘        │
│  └──────────┘        │               │              │
│                      │               ↓              │
│              ┌───────────────┐ ┌──────────┐        │
│              │  localStorage │ │ Backend  │        │
│              │  (auth-store) │ │   API    │        │
│              └───────────────┘ └──────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Feature Modules Overview

| Module | Store | Service | Pages | Role Access |
|--------|-------|---------|-------|-------------|
| **Auth** | authStore | auth.service | Login, Register, ForgotPassword | All |
| **Kamar** | kamarStore | kamar.service | KamarList, KamarDetail, KamarForm | All / Pemilik (CRUD) |
| **Users** | userStore | user.service | UserList, UserForm, Profile | Pemilik / All (profile) |
| **Barang** | barangStore | barang.service | BarangList, BarangForm | All / Pemilik (master) |
| **Tagihan** | tagihanStore | tagihan.service | TagihanList, TagihanDetail, TagihanForm | All |
| **Payment** | - | payment.service | PaymentList, PaymentFinish | All |
| **Laporan** | laporanStore | laporan.service | LaporanList, LaporanDetail, LaporanForm | All |

### Route Protection Logic

```javascript
// Route access decision tree
User visits URL
     ↓
Is route public (/login, /register, /)?
├── Yes → Render page
└── No → Check authentication
              ↓
         Is user authenticated?
         ├── No → Redirect to /login?redirect=URL
         └── Yes → Check role requirements
                        ↓
                   Route requires specific role?
                   ├── No → Render page
                   └── Yes → User has required role?
                              ├── Yes → Render page
                              └── No → Redirect to /dashboard
```

### Actual Route Configuration

| Path | Component | Layout | Auth | Role |
|------|-----------|--------|:----:|------|
| `/` | Home | - | no | - |
| `/login` | Login | AuthLayout | no | - |
| `/register` | Register | AuthLayout | no | - |
| `/verify-email` | VerifyEmail | AuthLayout | no | - |
| `/forgot-password` | ForgotPassword | AuthLayout | no | - |
| `/reset-password` | ResetPassword | AuthLayout | no | - |
| `/dashboard` | Dashboard | MainLayout | yes | All |
| `/profile` | Profile | MainLayout | yes | All |
| `/kamar` | KamarList | MainLayout | yes | All |
| `/kamar/new` | KamarForm | MainLayout | yes | Pemilik |
| `/kamar/:id` | KamarDetail | MainLayout | yes | All |
| `/kamar/:id/edit` | KamarForm | MainLayout | yes | Pemilik |
| `/users` | UserList | MainLayout | yes | Pemilik |
| `/users/new` | UserForm | MainLayout | yes | Pemilik |
| `/barang` | BarangList | MainLayout | yes | All |
| `/barang/new` | BarangForm | MainLayout | yes | Pemilik |
| `/tagihan` | TagihanList | MainLayout | yes | All |
| `/tagihan/new` | TagihanForm | MainLayout | yes | Pemilik |
| `/tagihan/:id` | TagihanDetail | MainLayout | yes | All |
| `/payment` | PaymentList | MainLayout | yes | All |
| `/payment/finish` | PaymentFinish | MainLayout | yes | All |
| `/laporan` | LaporanList | MainLayout | yes | All |
| `/laporan/new` | LaporanForm | MainLayout | yes | Penghuni |
| `/laporan/:id` | LaporanDetail | MainLayout | yes | All |

