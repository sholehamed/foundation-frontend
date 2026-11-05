import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type BillingCycle = 'monthly' | 'yearly';

export interface CheckoutPlan {
    key: string;
    title: string;
    subtitle: string;
    monthlyPrice: number;
    yearlyPrice: number;
    badge: string | null;
    branchLimit: number;
    features: string[];
}

/** Public signup request: no client-provided TenantId, OwnerId or role IDs. */
export interface SignupCheckoutPayload {
    planKey: string;
    billingCycle: BillingCycle;
    promoCode: string | null;
    tenant: {
        name: string;
        slug: string;
        culture: string;
        timezone: string;
        currency: string;
    };
    businessProfile: {
        displayName: string;
        activityType: string;
        phone: string | null;
        city: string;
        address: string;
        postalCode: string | null;
        instagram: string | null;
    };
    owner: {
        firstName: string;
        lastName: string;
        mobile: string;
        email: string;
        password: string;
    };
    branch: {
        name: string;
        phone: string;
        city: string;
        address: string;
    } | null;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    captchaToken: string;
    captchaCode: string;
}

/** Provisioning success does NOT represent a verified payment or active subscription. */
export interface SignupCheckoutResponse {
    tenantId: string;
    ownerUserId: string;
    mainBranchId: string;
    slug: string;
    accountUsername: string;
    planStatus: 'pending_activation';
}

@Injectable({ providedIn: 'root' })
export class SignupCheckoutService {
    private readonly http = inject(HttpClient);
    private readonly endpoint = environment.apiUrl.replace(/\/$/, '') + '/public/signup';

    isSlugAvailable(slug: string): Observable<{ available: boolean }> {
        return this.http.get<{ available: boolean }>(this.endpoint + '/slug-available', {
            params: new HttpParams().set('slug', slug.trim().toLowerCase())
        });
    }

    startCheckout(payload: SignupCheckoutPayload): Observable<SignupCheckoutResponse> {
        return this.http.post<SignupCheckoutResponse>(this.endpoint + '/checkout', payload);
    }
}
