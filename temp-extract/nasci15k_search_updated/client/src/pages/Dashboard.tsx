import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const { data: history, isLoading } = trpc.search.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Bem-vindo, {user?.name || user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total de Buscas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{history?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Buscas Bem-sucedidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {history?.filter(h => h.status === "success").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Última Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-300">
                {history && history.length > 0
                  ? format(new Date(history[0].createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "Nenhuma busca realizada"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search History */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Histórico de Buscas</CardTitle>
            <CardDescription>Últimas 100 buscas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Data/Hora</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Valor</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Tempo (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 px-4 text-slate-300">
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-900 text-blue-200">
                            {item.searchType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                          {item.searchValue}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.status === "success"
                                ? "bg-green-900 text-green-200"
                                : item.status === "error"
                                ? "bg-red-900 text-red-200"
                                : "bg-yellow-900 text-yellow-200"
                            }`}
                          >
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {item.executionTime || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">Nenhuma busca realizada ainda</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/")}
                >
                  Ir para Busca
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
