import { Etcd3, Lease } from "etcd3";

export class EtcdService {
  private static instance: EtcdService;
  private etcdClient: Etcd3;
  private leases: Map<string, Lease> = new Map();

  constructor(private readonly etcdUrl: string) {
    this.etcdClient = new Etcd3({
      hosts: etcdUrl,
    });
  }

  public static async getInstance(etcdUrl: string): Promise<EtcdService> {
    if (!EtcdService.instance) {
      EtcdService.instance = new EtcdService(etcdUrl);
    }
    return EtcdService.instance;
  }

  async get(key: string): Promise<string | null> {
    const res = await this.etcdClient.get(key);
    return res.toString() || null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.etcdClient.put(key).value(value);
  }

  async delete(key: string): Promise<void> {
    await this.etcdClient.delete().key(key);
  }

  /**
   * 监听etcd中的key
   * @param key
   * @param callback
   * @returns
   */
  async watch(key: string, callback: (res: any) => void): Promise<void> {
    const watcher = await this.etcdClient.watch().key(key).create();
    watcher.on("put", (res) => {
      callback(res);
    });
    watcher.on("delete", (res) => {
      callback(res);
    });
  }

  /**
   * 监听etcd中的前缀
   * @param prefix
   * @param callback
   * @returns
   */
  async watchPrefix(
    prefix: string,
    callback: (res: any) => void
  ): Promise<void> {
    const watcher = await this.etcdClient.watch().prefix(prefix).create();
    watcher.on("put", (res) => {
      callback(res);
    });
    watcher.on("delete", (res) => {
      callback(res);
    });
  }
  /**
   * 服务注册携带租约
   * @param key
   * @param value
   * @param ttl
   * @returns
   */
  async registerWithLease(
    key: string,
    value: string,
    ttl: number = 10
  ): Promise<Lease> {
    const lease = this.etcdClient.lease(ttl);
    await lease.put(key).value(value);
    lease.on("lost", (err) => {
      console.error(err);
    });
    this.leases.set(key, lease);
    return lease;
  }

  /**
   * 服务注销
   * @param key
   * @returns
   */
  async unregister(key: string): Promise<void> {
    const lease = this.leases.get(key);
    if (lease) {
      await lease.revoke();
    }
    this.leases.delete(key);
  }

  /**
   * 获取所有前缀
   * @param prefix
   * @returns
   */
  async getAll(prefix: string): Promise<Record<string, string>> {
    return await this.etcdClient.getAll().prefix(prefix).strings();
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.etcdClient.close();
  }
}
