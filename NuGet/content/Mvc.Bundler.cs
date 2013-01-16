using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Web.Routing;

namespace ServiceStack.Mvc
{
	public enum BundleOptions
	{
		Normal,
		Minified,
		Combined,
		MinifiedAndCombined
	}

	public static class Bundler
	{
		public static Func<bool> CachePaths = IsProduction;
		public static Func<string, BundleOptions, string> DefaultUrlFilter = ProcessVirtualPathDefault;

		// Logic to determine if the app is running in production or dev environment
		public static bool IsProduction()
		{
			return (HttpContext.Current != null && !HttpContext.Current.IsDebuggingEnabled);
		}

		public static bool FileExists(string virtualPath)
		{
			if (!HostingEnvironment.IsHosted) return false;
			var filePath = HostingEnvironment.MapPath(virtualPath);
			return File.Exists(filePath);
		}

		static DateTime centuryBegin = new DateTime(2001, 1, 1);
		public static string TimestampString(string virtualPath)
		{
			try
			{
				if (HostingEnvironment.IsHosted)
				{
					var filePath = HostingEnvironment.MapPath(virtualPath);
					return Convert.ToString((File.GetLastWriteTimeUtc(filePath).Ticks - centuryBegin.Ticks) / 1000000000, 16);
				}
			}
			catch { } //ignore
			return string.Empty;
		}

		private static TVal GetOrAdd<TKey, TVal>(this Dictionary<TKey, TVal> map, TKey key, Func<TKey, TVal> factoryFn)
		{
			lock (map)
			{
				TVal ret;
				if (!map.TryGetValue(key, out ret))
				{
					map[key] = ret = factoryFn(key);
				}
				return ret;
			}
		}

		private static void SafeClear<TKey, TVal>(this Dictionary<TKey, TVal> map)
		{
			lock (map) map.Clear();
		}

		static readonly Dictionary<string, string> VirutalPathCache = new Dictionary<string, string>();
		private static string ProcessVirtualPathDefault(string virtualPath, BundleOptions options)
		{
			if (!CachePaths()) VirutalPathCache.SafeClear();

			return VirutalPathCache.GetOrAdd(virtualPath, str =>
			{
				// The path that comes in starts with ~/ and must first be made absolute

				if (options == BundleOptions.Minified || options == BundleOptions.MinifiedAndCombined)
				{
					if (virtualPath.EndsWith(".js") && !virtualPath.EndsWith(".min.js"))
					{
						var minPath = virtualPath.Replace(".js", ".min.js");
						if (FileExists(minPath))
							virtualPath = minPath;
					}
					else if (virtualPath.EndsWith(".css") && !virtualPath.EndsWith(".min.css"))
					{
						var minPath = virtualPath.Replace(".css", ".min.css");
						if (FileExists(minPath))
							virtualPath = minPath;
					}
				}

				var path = virtualPath;
				if (virtualPath.IndexOf("://", StringComparison.Ordinal) == -1)
				{
					path = VirtualPathUtility.ToAbsolute(virtualPath);

					var cacheBreaker = TimestampString(virtualPath);
					if (!string.IsNullOrEmpty(cacheBreaker))
					{
						path += path.IndexOf('?') == -1
							? "?" + cacheBreaker
							: "&" + cacheBreaker;
					}
				}

				// Add your own modifications here before returning the path
				return path;
			});
		}

		private static string RewriteUrl(this string relativePath, BundleOptions options = BundleOptions.Normal)
		{
			return DefaultUrlFilter(relativePath, options);
		}

		public static MvcHtmlString ToMvcHtmlString(this string s)
		{
			return MvcHtmlString.Create(s);
		}

		public static MvcHtmlString ToMvcHtmlString(this TagBuilder t)
		{
			return t.ToString().ToMvcHtmlString();
		}

		public static MvcHtmlString ToMvcHtmlString(this TagBuilder t, TagRenderMode mode)
		{
			return t.ToString(mode).ToMvcHtmlString();
		}

		public static MvcHtmlString Link(this HtmlHelper html, string rel, string href, object htmlAttributes = null, BundleOptions options = BundleOptions.Normal)
		{
			if (string.IsNullOrEmpty(href))
				return MvcHtmlString.Empty;

			if (href.StartsWith("~/"))
				href = href.Replace("~/", VirtualPathUtility.ToAbsolute("~/"));

			var tag = new TagBuilder("link");
			tag.MergeAttribute("rel", rel);

			tag.MergeAttribute("href", href.RewriteUrl(options));

			if (htmlAttributes != null)
				tag.MergeAttributes(new RouteValueDictionary(htmlAttributes));

			return tag.ToString(TagRenderMode.SelfClosing).ToMvcHtmlString();
		}

		public static MvcHtmlString Css(this HtmlHelper html, string href, string media = null, BundleOptions options = BundleOptions.Minified)
		{
			return media != null
				   ? html.Link("stylesheet", href, new { media }, options)
				   : html.Link("stylesheet", href, null, options);
		}

		public static T If<T>(this HtmlHelper html, bool predicate, T whenTrue, T whenFalse)
		{
			return predicate ? whenTrue : whenFalse;
		}

		public static MvcHtmlString Img(this HtmlHelper html, string src, string alt, string link = null, object htmlAttributes = null)
		{
			if (string.IsNullOrEmpty(src))
				return MvcHtmlString.Empty;

			if (src.StartsWith("~/"))
				src = src.Replace("~/", VirtualPathUtility.ToAbsolute("~/"));

			var tag = new TagBuilder("img");

			tag.MergeAttribute("src", src.RewriteUrl());
			tag.MergeAttribute("alt", alt);
			if (htmlAttributes != null)
				tag.MergeAttributes(new RouteValueDictionary(htmlAttributes));

			if (!string.IsNullOrEmpty(link))
			{
				var a = new TagBuilder("a");
				a.MergeAttribute("href", link);
				a.InnerHtml = tag.ToString(TagRenderMode.Normal);
				return a.ToMvcHtmlString();
			}

			return tag.ToString(TagRenderMode.SelfClosing).ToMvcHtmlString();
		}

		public static MvcHtmlString Js(this HtmlHelper html, string src, BundleOptions options = BundleOptions.Minified)
		{
			if (string.IsNullOrEmpty(src))
				return MvcHtmlString.Empty;

			if (src.StartsWith("~/"))
				src = src.Replace("~/", VirtualPathUtility.ToAbsolute("~/"));

			var tag = new TagBuilder("script");
			tag.MergeAttribute("type", "text/javascript");

			tag.MergeAttribute("src", src.RewriteUrl(options));

			return tag.ToString(TagRenderMode.Normal).ToMvcHtmlString();
		}

		public static MvcHtmlString Img(this HtmlHelper html, Uri url, string alt, Uri link = null, object htmlAttributes = null)
		{
			return html.Img(url.ToString(), alt, link != null ? link.ToString() : "", htmlAttributes);
		}

		public static string ToJsBool(this bool value)
		{
			return value.ToString(CultureInfo.InvariantCulture).ToLower();
		}

		static readonly Dictionary<string, MvcHtmlString> BundleCache = new Dictionary<string, MvcHtmlString>();

		public static MvcHtmlString RenderJsBundle(this HtmlHelper html, string bundlePath, BundleOptions options = BundleOptions.Minified)
		{
			if (string.IsNullOrEmpty(bundlePath))
				return MvcHtmlString.Empty;

			if (!CachePaths()) BundleCache.SafeClear();

			return BundleCache.GetOrAdd(bundlePath, str =>
			{
				var filePath = HostingEnvironment.MapPath(bundlePath);

				var baseUrl = VirtualPathUtility.GetDirectory(bundlePath);

				if (options == BundleOptions.Combined)
					return html.Js(bundlePath.Replace(".bundle", ""), options);
				if (options == BundleOptions.MinifiedAndCombined)
					return html.Js(bundlePath.Replace(".js.bundle", ".min.js"), options);

				var jsFiles = File.ReadAllLines(filePath);

				var scripts = new StringBuilder();
				foreach (var file in jsFiles)
				{
					var jsFile = file.Trim().Replace(".coffee", ".js");
					//Apply the same filtering logic as bundler.js
					if ((jsFile.StartsWith(".") && !jsFile.StartsWith("..")) || jsFile.StartsWith("#"))
					{
						continue;
					}
					var jsSrc = Path.Combine(baseUrl, jsFile);

					scripts.AppendLine(
						html.Js(jsSrc, options).ToString()
					);
				}

				return scripts.ToString().ToMvcHtmlString();
			});
		}

		public static MvcHtmlString RenderCssBundle(this HtmlHelper html, string bundlePath, BundleOptions options = BundleOptions.Minified, string media = null)
		{
			if (string.IsNullOrEmpty(bundlePath))
				return MvcHtmlString.Empty;

			if (!CachePaths()) BundleCache.SafeClear();

			return BundleCache.GetOrAdd(bundlePath, str =>
			{
				var filePath = HostingEnvironment.MapPath(bundlePath);

				var baseUrl = VirtualPathUtility.GetDirectory(bundlePath);

				if (options == BundleOptions.Combined)
					return html.Css(bundlePath.Replace(".bundle", ""), media, options);
				if (options == BundleOptions.MinifiedAndCombined)
					return html.Css(bundlePath.Replace(".css.bundle", ".min.css"), media, options);

				var cssFiles = File.ReadAllLines(filePath);

				var styles = new StringBuilder();
				foreach (var file in cssFiles)
				{
					var cssFile = file.Trim().Replace(".less", ".css");
					//Apply the same filtering logic as bundler.js
					if ((cssFile.StartsWith(".") && !cssFile.StartsWith("..")) || cssFile.StartsWith("#"))
					{
						continue;
					}
					var cssSrc = Path.Combine(baseUrl, cssFile);

					styles.AppendLine(
						html.Css(cssSrc, media, options).ToString()
					);
				}

				return styles.ToString().ToMvcHtmlString();
			});
		}
	}
}