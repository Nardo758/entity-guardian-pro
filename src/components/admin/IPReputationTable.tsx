import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, Shield, Ban, RotateCcw, Trash2 } from 'lucide-react';
import { IPReputationRecord } from '@/hooks/useIPReputation';
import { formatDistanceToNow } from 'date-fns';

interface IPReputationTableProps {
  ipReputations: IPReputationRecord[];
  onBlock: (ipAddress: string, hours: number) => void;
  onUnblock: (ipAddress: string) => void;
  onReset: (ipAddress: string) => void;
  onDelete: (ipAddress: string) => void;
}

const getRiskBadgeVariant = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const IPReputationTable: React.FC<IPReputationTableProps> = ({
  ipReputations,
  onBlock,
  onUnblock,
  onReset,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredIPs = React.useMemo(() => {
    return ipReputations.filter(ip => {
      const matchesSearch = ip.ip_address.includes(searchTerm);
      const matchesRisk = riskFilter === 'all' || ip.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [ipReputations, searchTerm, riskFilter]);

  const isBlocked = (ip: IPReputationRecord) => {
    return ip.blocked_until && new Date(ip.blocked_until) > new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Violations</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIPs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No IP addresses found
                </TableCell>
              </TableRow>
            ) : (
              filteredIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{ip.ip_address}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-2 w-20 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full transition-all ${
                            ip.reputation_score >= 80
                              ? 'bg-green-500'
                              : ip.reputation_score >= 60
                              ? 'bg-blue-500'
                              : ip.reputation_score >= 30
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${ip.reputation_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{ip.reputation_score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(ip.risk_level)}>
                      {ip.risk_level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div>Auth: {ip.failed_auth_attempts}</div>
                      <div>Rate: {ip.rate_limit_violations}</div>
                      <div>Sus: {ip.suspicious_patterns}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(ip.last_seen_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {isBlocked(ip) ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Ban className="h-3 w-3" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isBlocked(ip) ? (
                          <DropdownMenuItem onClick={() => onUnblock(ip.ip_address)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Unblock IP
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => onBlock(ip.ip_address, 1)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Block for 1 hour
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onBlock(ip.ip_address, 24)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Block for 24 hours
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => onReset(ip.ip_address)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Reputation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(ip.ip_address)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
