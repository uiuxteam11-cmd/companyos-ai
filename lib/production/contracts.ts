/** Integration contracts: production providers are selected/configured outside this repository. */
export interface JobQueue { enqueue(name: string, payload: Record<string, unknown>): Promise<{ id: string }>; }
export interface BillingProvider { createCustomer(workspaceId: string): Promise<{ customerId: string }>; reportUsage(customerId: string, metric: string, quantity: number): Promise<void>; }
export interface SsoProvider { getLoginUrl(workspaceId: string, redirectUrl: string): Promise<string>; }
