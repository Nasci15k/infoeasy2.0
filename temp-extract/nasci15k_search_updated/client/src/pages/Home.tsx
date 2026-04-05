import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Search states
  const [searchType, setSearchType] = useState<string>("cpf");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, unknown> | null>(null);
  const [searchErrors, setSearchErrors] = useState<Record<string, string>>({});

  // tRPC mutations
  const searchByCpf = trpc.search.byCpf.useMutation();
  const searchByCnpj = trpc.search.byCnpj.useMutation();
  const searchByEmail = trpc.search.byEmail.useMutation();
  const searchByPhone = trpc.search.byPhone.useMutation();
  const searchByPlate = trpc.search.byPlate.useMutation();
  const searchByCep = trpc.search.byCep.useMutation();

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Por favor, insira um valor para buscar");
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchErrors({});

    try {
      let result;

      switch (searchType) {
        case "cpf":
          result = await searchByCpf.mutateAsync({ cpf: searchValue });
          break;
        case "cnpj":
          result = await searchByCnpj.mutateAsync({ cnpj: searchValue });
          break;
        case "email":
          result = await searchByEmail.mutateAsync({ email: searchValue });
          break;
        case "phone":
          result = await searchByPhone.mutateAsync({ phone: searchValue });
          break;
        case "plate":
          result = await searchByPlate.mutateAsync({ plate: searchValue });
          break;
        case "cep":
          result = await searchByCep.mutateAsync({ cep: searchValue });
          break;
        default:
          toast.error("Tipo de busca inválido");
          return;
      }

      if (result.success) {
        setSearchResults(result.results);
        toast.success(`Busca concluída! ${result.successfulApis} de ${result.totalApis} APIs retornaram dados.`);
      } else {
        toast.error("Nenhum resultado encontrado");
      }

      if (Object.keys(result.errors).length > 0) {
        setSearchErrors(result.errors);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar busca");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">{user.name || user.email}</span>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Busca de Dados Profissional
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Consulte informações de CPF, CNPJ, telefone, email, placa de veículo e CEP em múltiplas bases de dados brasileiras de forma rápida e segura.
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-4xl mx-auto mb-8 border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Iniciar Busca</CardTitle>
            <CardDescription>Selecione o tipo de dado e insira o valor para buscar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Type Tabs */}
              <Tabs value={searchType} onValueChange={setSearchType} className="w-full">
                <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-2 bg-slate-700">
                  <TabsTrigger value="cpf" className="text-xs md:text-sm">CPF</TabsTrigger>
                  <TabsTrigger value="cnpj" className="text-xs md:text-sm">CNPJ</TabsTrigger>
                  <TabsTrigger value="email" className="text-xs md:text-sm">Email</TabsTrigger>
                  <TabsTrigger value="phone" className="text-xs md:text-sm">Telefone</TabsTrigger>
                  <TabsTrigger value="plate" className="text-xs md:text-sm">Placa</TabsTrigger>
                  <TabsTrigger value="cep" className="text-xs md:text-sm">CEP</TabsTrigger>
                </TabsList>

                {/* Input Fields */}
                <div className="mt-6 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={getPlaceholder(searchType)}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isSearching}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchValue.trim()}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {searchResults && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-bold text-white">Resultados da Busca</h3>
            </div>

            <div className="grid gap-4">
              {Object.entries(searchResults).map(([apiName, data]) => (
                <Card key={apiName} className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{apiName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-auto max-h-64">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Errors Section */}
        {Object.keys(searchErrors).length > 0 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Erros na Busca</h3>
            </div>

            <div className="grid gap-2">
              {Object.entries(searchErrors).map(([apiName, error]) => (
                <Card key={apiName} className="border-red-900 bg-red-950">
                  <CardContent className="pt-6">
                    <p className="text-sm text-red-200">
                      <strong>{apiName}:</strong> {error}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Modules Link */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <Button
            onClick={() => navigate("/modules")}
            className="bg-green-600 hover:bg-green-700 gap-2"
            size="lg"
          >
            <span>Acessar Módulos Avançados</span>
          </Button>
          <p className="text-slate-400 text-sm mt-2">IP, MAC Address, Placa Serpro e mais</p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">40+ APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                Integração com múltiplas bases de dados brasileiras para resultados completos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Rápido & Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                Buscas paralelas com timeout de segurança e tratamento de erros.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                Usuários autenticados têm acesso ao histórico completo de buscas.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2025 {APP_TITLE}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function getPlaceholder(searchType: string): string {
  switch (searchType) {
    case "cpf":
      return "Digite o CPF (ex: 123.456.789-00)";
    case "cnpj":
      return "Digite o CNPJ (ex: 12.345.678/0001-90)";
    case "email":
      return "Digite o email (ex: usuario@exemplo.com)";
    case "phone":
      return "Digite o telefone (ex: 11 9 9999-9999)";
    case "plate":
      return "Digite a placa (ex: ABC1234)";
    case "cep":
      return "Digite o CEP (ex: 01310-100)";
    default:
      return "Digite o valor para buscar";
  }
}
