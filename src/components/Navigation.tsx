import { Link, useLocation } from "react-router-dom";
import { Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Schedule", icon: Calendar },
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ShiftManager</span>
          </div>

          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
