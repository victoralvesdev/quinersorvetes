"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  X,
  Upload,
  Search,
  Package,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign,
  ImageIcon,
  RefreshCw,
  MoreVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Lock,
  Coins,
  Archive,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Product, Category, ProductVariation } from "@/types/product";
import { useToast } from "@/components/ui/Toast";

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
        <div className="h-6 bg-gray-200 rounded-lg w-1/3" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="h-4 bg-gray-200 rounded-lg w-32" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-16" /></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16" /></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-lg w-20" /></td>
    </tr>
  );
}

export default function ProdutosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProductId, setDragProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    available: true,
    price_from: false,
    stock_quantity: "",
    low_stock_threshold: "",
  });

  // Variations state
  const [variations, setVariations] = useState<Omit<ProductVariation, 'id'>[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Abre o formulário de edição se ?edit=<id> estiver na URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || isLoading) return;
    const product = products.find((p) => p.id === editId);
    if (product) {
      handleOpenForm(product);
      router.replace("/gestao-admin/produtos");
    }
  }, [searchParams, products, isLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showToast("Erro ao carregar produtos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      showToast("Dados atualizados!", "success");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formata número para moeda BRL (ex: 1234 -> "12,34")
  const formatPriceToBRL = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converte string formatada para número (ex: "12,34" -> 12.34)
  const parsePriceFromBRL = (value: string): number => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    // Converte centavos para reais
    return parseInt(numbers || '0', 10) / 100;
  };

  // Handler para formatação do preço durante digitação
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove tudo exceto números
    const numbers = inputValue.replace(/\D/g, '');

    if (numbers === '') {
      setFormData({ ...formData, price: '' });
      return;
    }

    // Converte para número e formata
    const numericValue = parseInt(numbers, 10) / 100;
    const formatted = formatPriceToBRL(numericValue);
    setFormData({ ...formData, price: formatted });
  };

  // Handler para upload de imagem
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Valida tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast("Formato inválido. Use JPG, PNG, GIF ou WebP.", "error");
        return;
      }

      // Valida tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Imagem muito grande. Máximo 5MB.", "error");
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadRes = await fetch("/api/admin/storage/upload", {
        method: "POST",
        body: uploadFormData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setFormData({ ...formData, image: url });
        showToast("Imagem enviada com sucesso!", "success");
      } else {
        showToast("Erro ao enviar imagem", "error");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      showToast("Erro ao enviar imagem", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler para input de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handlers para drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleOpenForm = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: formatPriceToBRL(product.price),
        image: product.image || "",
        available: product.available,
        price_from: product.price_from ?? false,
        stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
        low_stock_threshold: product.low_stock_threshold != null ? String(product.low_stock_threshold) : "",
      });
      // Carregar variações do produto
      const variationsRes = await fetch(`/api/admin/products/variations?productId=${product.id}`);
      const productVariations: ProductVariation[] = await variationsRes.json();
      setVariations(productVariations.map(v => ({
        name: v.name,
        required: v.required,
        has_price: v.has_price,
        display_order: v.display_order,
        items: v.items.map(item => ({
          name: item.name,
          price: item.price,
          display_order: item.display_order,
        })),
      })));
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        category: categories[0]?.id || "",
        price: "",
        image: "",
        available: true,
        price_from: false,
        stock_quantity: "",
        low_stock_threshold: "",
      });
      setVariations([]);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category: categories[0]?.id || "",
      price: "",
      image: "",
      available: true,
      price_from: false,
      stock_quantity: "",
      low_stock_threshold: "",
    });
    setVariations([]);
  };

  const sendLowStockAlert = async (productName: string, stockQty: number, threshold: number) => {
    try {
      await fetch('/api/whatsapp/low-stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, stockQuantity: stockQty, threshold }),
      });
    } catch {
      // Silencia erros de notificação — não bloqueia o fluxo principal
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const priceValue = parsePriceFromBRL(formData.price);
      const stockQty = formData.stock_quantity !== "" ? parseInt(formData.stock_quantity, 10) : null;
      const stockThreshold = formData.low_stock_threshold !== "" ? parseInt(formData.low_stock_threshold, 10) : null;
      let productId: string | null = null;

      if (editingProduct) {
        const res = await fetch("/api/admin/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formData.name,
            description: formData.description,
            price: priceValue,
            category_id: formData.category,
            image: formData.image,
            available: formData.available,
            price_from: formData.price_from,
            stock_quantity: stockQty,
            low_stock_threshold: stockThreshold,
          }),
        });
        if (res.ok) {
          productId = editingProduct.id;
          // Envia alerta se estoque mudou e está abaixo do limite
          const prevStock = editingProduct.stock_quantity;
          if (
            stockQty !== null &&
            stockThreshold !== null &&
            stockQty <= stockThreshold &&
            stockQty !== prevStock
          ) {
            await sendLowStockAlert(formData.name, stockQty, stockThreshold);
          }
        } else {
          showToast("Erro ao atualizar produto", "error");
          return;
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: priceValue,
            category_id: formData.category,
            image: formData.image,
            available: formData.available,
            price_from: formData.price_from,
            stock_quantity: stockQty,
            low_stock_threshold: stockThreshold,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          productId = created.id;
          // Envia alerta se novo produto já começa com estoque baixo
          if (stockQty !== null && stockThreshold !== null && stockQty <= stockThreshold) {
            await sendLowStockAlert(formData.name, stockQty, stockThreshold);
          }
        } else {
          showToast("Erro ao criar produto", "error");
          return;
        }
      }

      // Salvar variações
      if (productId) {
        const variationsRes = await fetch("/api/admin/products/variations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variations }),
        });
        if (!variationsRes.ok) {
          showToast("Produto salvo, mas houve erro ao salvar variações", "error");
        }
      }

      showToast(editingProduct ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!", "success");
      loadData();
      handleCloseForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      showToast("Erro ao salvar produto", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Funções para gerenciar variações
  const addVariation = () => {
    setVariations([...variations, {
      name: "",
      required: false,
      has_price: false,
      display_order: variations.length,
      items: [],
    }]);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const updateVariation = (index: number, field: keyof Omit<ProductVariation, 'id' | 'items'>, value: boolean | string | number) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const addVariationItem = (variationIndex: number) => {
    const updated = [...variations];
    updated[variationIndex].items = [
      ...updated[variationIndex].items,
      {
        name: "",
        price: 0,
        display_order: updated[variationIndex].items.length,
      },
    ];
    setVariations(updated);
  };

  const removeVariationItem = (variationIndex: number, itemIndex: number) => {
    const updated = [...variations];
    updated[variationIndex].items = updated[variationIndex].items.filter((_, i) => i !== itemIndex);
    setVariations(updated);
  };

  const updateVariationItem = (variationIndex: number, itemIndex: number, field: 'name' | 'price' | 'display_order', value: string | number) => {
    const updated = [...variations];
    updated[variationIndex].items[itemIndex] = {
      ...updated[variationIndex].items[itemIndex],
      [field]: value,
    };
    setVariations(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Produto excluido com sucesso!", "success");
        loadData();
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      showToast("Erro ao excluir produto", "error");
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id: product.id }),
      });
      if (res.ok) {
        showToast(`"${product.name}" duplicado com sucesso!`, "success");
        loadData();
      } else {
        showToast("Erro ao duplicar produto", "error");
      }
    } catch (error) {
      console.error("Erro ao duplicar produto:", error);
      showToast("Erro ao duplicar produto", "error");
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, available: !product.available }),
      });
      if (res.ok) {
        showToast(
          product.available ? "Produto desativado" : "Produto ativado",
          "success"
        );
        loadData();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      showToast("Erro ao atualizar status", "error");
    }
  };

  // --- Drag and drop para reordenar produtos ---
  const handleProductDragStart = (e: React.DragEvent, productId: string) => {
    setDragProductId(productId);
    e.dataTransfer.effectAllowed = "move";
    // Imagem fantasma transparente — o visual é controlado pelo CSS
    const ghost = document.createElement("div");
    ghost.style.opacity = "0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleProductDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragProductId && productId !== dragProductId) {
      setDragOverProductId(productId);
    }
  };

  const handleProductDragEnd = () => {
    setDragProductId(null);
    setDragOverProductId(null);
  };

  const handleProductDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragProductId || dragProductId === targetId) {
      handleProductDragEnd();
      return;
    }

    const oldIndex = products.findIndex((p) => p.id === dragProductId);
    const newIndex = products.findIndex((p) => p.id === targetId);
    if (oldIndex === -1 || newIndex === -1) {
      handleProductDragEnd();
      return;
    }

    // Reordena localmente
    const reordered = [...products];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setProducts(reordered);
    handleProductDragEnd();

    // Salva no backend
    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/admin/products/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
      });
      if (!res.ok) {
        showToast("Erro ao salvar ordem", "error");
        loadData();
      }
    } catch {
      showToast("Erro ao salvar ordem", "error");
      loadData();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const isReorderEnabled = searchQuery === "" && filterCategory === "all" && filterStatus === "all";

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && product.available) ||
      (filterStatus === "inactive" && !product.available);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  // Stats
  const stats = {
    total: products.length,
    active: products.filter((p) => p.available).length,
    inactive: products.filter((p) => !p.available).length,
    categories: categories.length,
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Catalogo</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Gerenciar Produtos
          </h1>
          <p className="text-secondary/60 mt-1">
            Adicione, edite e gerencie os produtos do seu cardapio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-dark">{stats.total}</p>
              <p className="text-xs text-secondary/50">Total</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-xs text-secondary/50">Ativos</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
              <p className="text-xs text-secondary/50">Inativos</p>
            </div>
          </div>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-secondary", isRefreshing && "animate-spin")} />
          </button>

          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                Buscar Produtos
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome do produto..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categoria
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
              >
                <option value="all">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-auto">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Todos", color: "gray" },
                  { value: "active", label: "Ativos", color: "emerald" },
                  { value: "inactive", label: "Inativos", color: "red" },
                ].map((option) => {
                  const isSelected = filterStatus === option.value;
                  const colorClasses = {
                    gray: isSelected ? "bg-gray-600 text-white border-gray-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400",
                    emerald: isSelected ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400",
                    red: isSelected ? "bg-red-500 text-white border-red-500" : "bg-red-50 text-red-600 border-red-200 hover:border-red-400",
                  };

                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterStatus(option.value)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                        colorClasses[option.color as keyof typeof colorClasses]
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Toggle */}
            <div className="lg:w-auto">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                Visualizacao
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-secondary/50 hover:text-secondary"
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-secondary/50 hover:text-secondary"
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count & Reorder hint */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            {(searchQuery || filterCategory !== "all" || filterStatus !== "all") ? (
              <p className="text-sm text-secondary/60">
                Encontrado{filteredProducts.length !== 1 ? "s" : ""}{" "}
                <span className="font-semibold text-secondary-dark">{filteredProducts.length}</span>{" "}
                produto{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            ) : <div />}
            <div className="flex items-center gap-2 text-xs text-secondary/50">
              {isSavingOrder ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Salvando ordem...
                </>
              ) : isReorderEnabled ? (
                <>
                  <GripVertical className="w-3 h-3" />
                  Arraste para reordenar
                </>
              ) : (
                <>
                  <GripVertical className="w-3 h-3 opacity-50" />
                  Remova os filtros para reordenar
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Preco</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-secondary/70 font-medium">Nenhum produto encontrado</p>
          <p className="text-sm text-secondary/50 mt-1">Tente ajustar os filtros ou adicione um novo produto</p>
          <button
            onClick={() => handleOpenForm()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              draggable={isReorderEnabled}
              onDragStart={(e) => handleProductDragStart(e, product.id)}
              onDragOver={(e) => handleProductDragOver(e, product.id)}
              onDragEnd={handleProductDragEnd}
              onDrop={(e) => handleProductDrop(e, product.id)}
              className={cn(
                "bg-white rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg group relative",
                product.available ? "border-gray-100" : "border-red-200 bg-red-50/30",
                dragProductId === product.id && "opacity-40 scale-95 rotate-1",
                dragOverProductId === product.id && "border-primary ring-2 ring-primary/30 scale-[1.02]",
                isReorderEnabled && "cursor-grab active:cursor-grabbing"
              )}
            >
              {/* Drag Handle */}
              {isReorderEnabled && (
                <div className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="w-4 h-4 text-secondary/40" />
                </div>
              )}

              {/* Drop indicator */}
              {dragOverProductId === product.id && dragProductId !== product.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/5 rounded-2xl pointer-events-none">
                  <span className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-lg">
                    Soltar aqui
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1",
                    product.available
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                  )}>
                    {product.available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {product.available ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenForm(product); }}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(product); }}
                    className="p-2 bg-white/90 hover:bg-blue-50 rounded-lg shadow-sm transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                    className="p-2 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-secondary-dark line-clamp-1">{product.name}</h3>
                </div>

                <p className="text-xs text-secondary/50 mb-3">
                  <Tag className="w-3 h-3 inline mr-1" />
                  {getCategoryName(product.category)}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleAvailability(product); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                      product.available
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                  >
                    {product.available ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Preco</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    draggable={isReorderEnabled}
                    onDragStart={(e) => handleProductDragStart(e, product.id)}
                    onDragOver={(e) => handleProductDragOver(e, product.id)}
                    onDragEnd={handleProductDragEnd}
                    onDrop={(e) => handleProductDrop(e, product.id)}
                    className={cn(
                      "hover:bg-gray-50 transition-all",
                      dragProductId === product.id && "opacity-40",
                      dragOverProductId === product.id && "bg-primary/5 shadow-inner",
                      isReorderEnabled && "cursor-grab active:cursor-grabbing"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isReorderEnabled && (
                          <GripVertical className="w-4 h-4 text-secondary/30 flex-shrink-0" />
                        )}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-dark">{product.name}</p>
                          <p className="text-xs text-secondary/50 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-secondary/70 rounded-lg text-xs font-medium">
                        {getCategoryName(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200",
                          product.available
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        )}
                      >
                        {product.available ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {product.available ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenForm(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-secondary/60" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Drawer */}
      {isFormOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed bg-black/50 backdrop-blur-sm transition-opacity"
            style={{ zIndex: 99998, top: -100, left: 0, right: 0, bottom: 0 }}
            onClick={handleCloseForm}
          />

          {/* Drawer */}
          <div
            className="fixed right-0 w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
            style={{ zIndex: 99999, top: -100, bottom: 0, paddingTop: 100 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <h2 className="text-xl font-bold text-secondary-dark">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h2>
                <p className="text-sm text-secondary/50">
                  {editingProduct ? "Atualize as informacoes do produto" : "Preencha os dados do novo produto"}
                </p>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-secondary/60" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-secondary-dark mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Milkshake de Morango"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-secondary-dark mb-2">
                  Descricao
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o produto..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Category & Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary-dark mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-dark mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Preco (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.price}
                      onChange={handlePriceChange}
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Price From Toggle */}
              <div
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer select-none"
                onClick={() => setFormData({ ...formData, price_from: !formData.price_from })}
              >
                <div>
                  <p className="text-sm font-semibold text-secondary-dark">Exibir &quot;A partir de:&quot;</p>
                  <p className="text-xs text-secondary/50">
                    {formData.price_from
                      ? `Vai mostrar: A partir de: ${formData.price ? `R$ ${formData.price}` : "R$ 0,00"}`
                      : "Vai mostrar o preço fixo normalmente"}
                  </p>
                </div>
                <div className={cn(
                  "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 flex-shrink-0",
                  formData.price_from ? "bg-primary" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                    formData.price_from ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
              </div>

              {/* Stock */}
              <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Archive className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold text-secondary-dark">Controle de Estoque</p>
                  <span className="text-xs text-secondary/40 font-normal">(opcional)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-secondary/70 mb-1.5">
                      Quantidade em estoque
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="Ex: 50"
                      className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary/70 mb-1.5">
                      Alertar quando restar
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      placeholder="Ex: 5"
                      className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm"
                    />
                  </div>
                </div>
                {formData.stock_quantity !== "" && formData.low_stock_threshold !== "" &&
                  parseInt(formData.stock_quantity) <= parseInt(formData.low_stock_threshold) && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-xs font-medium">Estoque atual está abaixo do limite de alerta</p>
                  </div>
                )}
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-secondary-dark mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Imagem do Produto
                </label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 transition-all duration-200",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30"
                  )}
                >
                  {formData.image ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isUploading ? (
                    <div className="flex flex-col items-center py-8">
                      <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3" />
                      <p className="text-sm font-medium text-secondary">Enviando imagem...</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center py-6 cursor-pointer"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-colors",
                        isDragging ? "bg-primary/10" : "bg-gray-100"
                      )}>
                        <Upload className={cn(
                          "w-7 h-7 transition-colors",
                          isDragging ? "text-primary" : "text-gray-400"
                        )} />
                      </div>
                      <p className="text-sm font-medium text-secondary-dark mb-1">
                        {isDragging ? "Solte a imagem aqui" : "Clique ou arraste uma imagem"}
                      </p>
                      <p className="text-xs text-secondary/50">
                        JPG, PNG, GIF ou WebP (máx. 5MB)
                      </p>
                    </div>
                  )}

                  {/* URL Input - show only when no image */}
                  {!formData.image && !isUploading && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-secondary/50 mb-2 text-center">ou cole uma URL</p>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Variations Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-secondary-dark">
                    Subcategorias / Variações
                  </label>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Subcategoria
                  </button>
                </div>

                {variations.length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary/50">Nenhuma subcategoria adicionada</p>
                    <p className="text-xs text-secondary/40 mt-1">Ex: Cobertura, Complemento, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variations.map((variation, vIndex) => (
                      <div key={vIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        {/* Variation Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={variation.name}
                              onChange={(e) => updateVariation(vIndex, 'name', e.target.value)}
                              placeholder="Ex: Cobertura, Complemento..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 text-sm font-medium"
                            />
                            <div className="flex items-center gap-3">
                              {/* Obrigatória Toggle */}
                              <button
                                type="button"
                                onClick={() => updateVariation(vIndex, 'required', !variation.required)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border",
                                  variation.required
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-gray-100 border-gray-200 text-secondary/60 hover:bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "relative w-8 h-4 rounded-full transition-colors duration-200",
                                  variation.required ? "bg-amber-500" : "bg-gray-300"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200",
                                    variation.required ? "translate-x-4" : "translate-x-0.5"
                                  )} />
                                </div>
                                <Lock className={cn(
                                  "w-3.5 h-3.5 transition-colors",
                                  variation.required ? "text-amber-600" : "text-secondary/40"
                                )} />
                                <span className="text-xs font-medium">Obrigatória</span>
                              </button>

                              {/* Tem Preço Adicional Toggle */}
                              <button
                                type="button"
                                onClick={() => updateVariation(vIndex, 'has_price', !variation.has_price)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border",
                                  variation.has_price
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-gray-100 border-gray-200 text-secondary/60 hover:bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "relative w-8 h-4 rounded-full transition-colors duration-200",
                                  variation.has_price ? "bg-emerald-500" : "bg-gray-300"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200",
                                    variation.has_price ? "translate-x-4" : "translate-x-0.5"
                                  )} />
                                </div>
                                <Coins className={cn(
                                  "w-3.5 h-3.5 transition-colors",
                                  variation.has_price ? "text-emerald-600" : "text-secondary/40"
                                )} />
                                <span className="text-xs font-medium">Tem preço</span>
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariation(vIndex)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>

                        {/* Variation Items */}
                        <div className="pl-2 border-l-2 border-gray-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-secondary/70">Itens:</p>
                            <button
                              type="button"
                              onClick={() => addVariationItem(vIndex)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Adicionar Item
                            </button>
                          </div>
                          {variation.items.length === 0 ? (
                            <p className="text-xs text-secondary/50 italic">Nenhum item adicionado</p>
                          ) : (
                            <div className="space-y-2">
                              {variation.items.map((item, iIndex) => (
                                <div key={iIndex} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateVariationItem(vIndex, iIndex, 'name', e.target.value)}
                                    placeholder="Ex: Morango, Chocolate..."
                                    className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-primary/30 text-xs"
                                  />
                                  {variation.has_price && (
                                    <div className="relative w-24">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary/50">R$</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatPriceToBRL(item.price)}
                                        onChange={(e) => {
                                          const price = parsePriceFromBRL(e.target.value);
                                          updateVariationItem(vIndex, iIndex, 'price', price);
                                        }}
                                        className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-primary/30 text-xs"
                                        placeholder="0,00"
                                      />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeVariationItem(vIndex, iIndex)}
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-secondary-dark">Disponivel para venda</p>
                  <p className="text-xs text-secondary/50">Produto aparece no cardapio</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, available: !formData.available })}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors duration-200",
                    formData.available ? "bg-emerald-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                    formData.available ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-secondary rounded-xl font-medium text-sm transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingProduct ? "Atualizar" : "Criar Produto"}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
