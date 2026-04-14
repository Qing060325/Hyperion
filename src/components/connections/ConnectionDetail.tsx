// ==========================================
// ConnectionDetail - Connection Detail Panel
// ==========================================

import { Show, createSignal, onMount } from "solid-js";
import { X, Globe, Clock, Zap, Network, MapPin, RefreshCw, ExternalLink } from "lucide-solid";
import type { ConnectionInfo } from "../../types/clash";
import type { IPLocation } from "../../types/connection";
import { geoipService } from "../../services/geoip";
import { formatBytes, formatDuration } from "../../utils/format";
import ripple from "@/components/ui/RippleEffect";

interface ConnectionDetailProps {
  connection: ConnectionInfo;
  onClose: () => void;
  onDisconnect?: (id: string) => void;
}

export default function ConnectionDetail(props: ConnectionDetailProps) {
  const [location, setLocation] = createSignal<IPLocation | null>(null);
  const [destLocation, setDestLocation] = createSignal<IPLocation | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const conn = props.connection;
    
    // Lookup source IP
    if (conn.metadata.source_ip) {
      const srcLoc = await geoipService.lookup(conn.metadata.source_ip);
      setLocation(srcLoc);
    }
    
    // Lookup destination IP
    if (conn.metadata.destination_ip) {
      const dstLoc = await geoipService.lookup(conn.metadata.destination_ip);
      setDestLocation(dstLoc);
    }
    
    setLoading(false);
  });

  const meta = () => props.connection.metadata;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm animate-modal-backdrop">
      <div class="card bg-base-100 shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-modal-content">
        {/* Header */}
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h3 class="font-bold text-lg">连接详情</h3>
            <button use:ripple class="btn btn-ghost btn-sm btn-circle" onClick={props.onClose}>
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div class="p-4 space-y-4 overflow-auto max-h-[70vh]">
            {/* Host */}
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-1">
                  <Globe class="w-4 h-4" />
                  目标主机
                </span>
              </label>
              <div class="font-mono text-sm bg-base-200 p-2 rounded">
                {meta().host || meta().destination_ip || '未知'}
                {meta().destination_port && `:${meta().destination_port}`}
              </div>
            </div>

            {/* Chain */}
            <Show when={props.connection.chains?.length > 0}>
              <div class="form-control">
                <label class="label">
                  <span class="label-text flex items-center gap-1">
                    <Network class="w-4 h-4" />
                    代理链路
                  </span>
                </label>
                <div class="flex flex-wrap gap-1">
                  {props.connection.chains.map((node, i) => (
                    <span class="flex items-center gap-1">
                      <span class="badge badge-primary">{node}</span>
                      {i < props.connection.chains.length - 1 && <span>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </Show>

            {/* Location */}
            <Show when={!loading() && destLocation()}>
              <div class="form-control">
                <label class="label">
                  <span class="label-text flex items-center gap-1">
                    <MapPin class="w-4 h-4" />
                    目标位置
                  </span>
                </label>
                <div class="flex items-center gap-3 bg-base-200 p-3 rounded">
                  <span class="text-3xl">
                    {geoipService.getCountryFlag(destLocation()?.country_code || '')}
                  </span>
                  <div>
                    <div class="font-medium">
                      {destLocation()?.city}, {destLocation()?.country}
                    </div>
                    <div class="text-xs text-base-content/50">
                      ISP: {destLocation()?.isp}
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* Process */}
            <Show when={meta().process}>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">进程</span>
                </label>
                <div class="flex items-center gap-2 bg-base-200 p-2 rounded">
                  <span class="font-medium">{meta().process}</span>
                  <Show when={meta().process_path}>
                    <span class="text-xs text-base-content/50 truncate">{meta().process_path}</span>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Rule */}
            <Show when={props.connection.rule}>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">匹配规则</span>
                </label>
                <code class="bg-base-200 p-2 rounded text-sm block">
                  {props.connection.rule}, {props.connection.rule_payload}
                </code>
              </div>
            </Show>

            {/* Traffic */}
            <div class="grid grid-cols-2 gap-4">
              <div class="stat bg-base-200 rounded p-3">
                <div class="stat-title text-xs">上传</div>
                <div class="stat-value text-lg text-info">
                  {formatBytes(props.connection.upload)}
                </div>
              </div>
              <div class="stat bg-base-200 rounded p-3">
                <div class="stat-title text-xs">下载</div>
                <div class="stat-value text-lg text-success">
                  {formatBytes(props.connection.download)}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  连接时间
                </span>
              </label>
              <div class="text-sm">
                {new Date(props.connection.start).toLocaleString('zh-CN')}
                <span class="text-base-content/50 ml-2">
                  ({formatDuration(Date.now() - new Date(props.connection.start).getTime())})
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div class="flex gap-2 p-4 border-t border-base-300">
            <button
              class="btn btn-error btn-sm flex-1"
              use:ripple
              onClick={() => props.onDisconnect?.(props.connection.id)}
            >
              断开连接
            </button>
            <button
              class="btn btn-ghost btn-sm"
              use:ripple
              onClick={props.onClose}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
