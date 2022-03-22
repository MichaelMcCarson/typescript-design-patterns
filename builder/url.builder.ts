import { Url } from "./url.model";

type ArgumentTypes<T> = T extends (...args: infer U) => infer R ? U : never;
type ReplaceReturnType<O, N> = (...a: ArgumentTypes<O>) => N;

/**
 * setQueryStringRetainNullValue and setSanitizedQueryString are optional calls, callable right before build.
 * A compile-time error will occur if build() is called before setBaseUrl, setRoute, and setEndpoint.
 */
type Builder<K extends keyof UrlBuilder> = {
    [U in K]: U extends 'setQueryStringRetainNullValue' | 'setSanitizedQueryString' | 'build'
    ? UrlBuilder[U]
    : ReplaceReturnType<
        UrlBuilder[U],
        Builder<
            Exclude<K, U> extends never
            ? 'setQueryStringRetainNullValues' | 'setSanitizedQueryString' | 'build'
            : Exclude<K, U>
        >
    >;
};

export class UrlBuilder {
    private url: Url;

    constructor() {
        this.url = {
            baseUrl: '',
            route: '',
            endpoint: '',
        };
    }

    public static builder(): Builder<
        Exclude<keyof UrlBuilder, 'build' | 'setQueryStringRetainNullValues' | 'setSanitizedQueryString'>
    > {
        return new UrlBuilder();
    }

    public setBaseUrl(baseUrl: string): UrlBuilder {
        this.url.baseUrl = baseUrl;
        return this;
    }

    public setRoute(route: string): UrlBuilder {
        this.url.route = route;
        return this;
    }

    public setEndpoint(endpoint: string): UrlBuilder {
        this.url.endpoint = endpoint;
        return this;
    }

    public setQueryStringRetainNullValues(params?: string | { [key: string]: any }): UrlBuilder {
        this.url.params = this.formatQueryString(true, params);
        return this;
    }

    private formatQueryString(keepNullValues?: boolean, params?: string | { [key: string]: any }): string {
        if (!params) {
            return '';
        }
        return typeof params === 'string'
            ? this.formatStringParameters(params)
            : this.formatObjectParameters(params, keepNullValues);
    }

    private formatStringParameters(params: string): string {
        return params[0] === '?' ? params : `?${params}`;
    }

    private formatObjectParameters(params: { [key: string]: any }, keepNullValues: boolean): string {
        return (
            '?' +
            Object.keys(params)
                .filter((k) => keepNullValues || this.removeNullAndUndefinedParameters(params, k))
                .map((k) => `${k}=${params[k]}`)
                .join('&')
        );
    }

    private removeNullAndUndefinedParameters(params: { [key: string]: any }, key: string): boolean {
        return !!params[key];
    }

    public setSanitizedQueryString(params?: string | { [key: string]: any }): UrlBuilder {
        this.url.params = this.formatQueryString(false, params);
        return this;
    }

    public build(): string {
        const build = this.url;
        this.url = undefined; // Builder is invalid after this

        if (!build.baseUrl || !build.route || !build.endpoint) {
            throw Error('The url is not formatted correctly.');
        }
        const params = build.params ??= '';
        return `${build.baseUrl}${build.route}${build.endpoint}${params}`;
    }
}
