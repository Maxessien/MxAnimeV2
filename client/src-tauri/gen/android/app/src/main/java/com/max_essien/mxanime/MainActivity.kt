package com.max_essien.mxanime

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
  private var customView: View? = null
  private var customViewCallback: WebChromeClient.CustomViewCallback? = null
  private var fullscreenContainer: FrameLayout? = null

  companion object {
    private const val STORAGE_PERMISSION_REQUEST_CODE = 1001
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    requestStoragePermissionIfNeeded()
    setupFullscreenHandling()
  }

  /**
   * Checks and requests runtime permissions on app launch based on Android SDK level.
   */
  private fun requestStoragePermissionIfNeeded() {
    val permissionsToRequest = mutableListOf<String>()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      // Android 13+ (API 33+) granular permissions
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(Manifest.permission.READ_MEDIA_VIDEO)
      }
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(Manifest.permission.READ_MEDIA_IMAGES)
      }
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(Manifest.permission.READ_MEDIA_AUDIO)
      }
    } else {
      // Android 12 (API 32) and below
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
      }
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
          permissionsToRequest.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
      }
    }

    if (permissionsToRequest.isNotEmpty()) {
      ActivityCompat.requestPermissions(
        this,
        permissionsToRequest.toTypedArray(),
        STORAGE_PERMISSION_REQUEST_CODE
      )
    }
  }

  /**
   * Helper if you use MANAGE_EXTERNAL_STORAGE for direct raw file downloads on Android 11+.
   * Call this if your app requires full file manager access for arbitrary downloads.
   */
  private fun requestAllFilesAccessIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      if (!Environment.isExternalStorageManager()) {
        try {
          val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
            data = Uri.parse("package:$packageName")
          }
          startActivity(intent)
        } catch (e: Exception) {
          val fallbackIntent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
          startActivity(fallbackIntent)
        }
      }
    }
  }

  private fun setupFullscreenHandling() {
    val rootView = findViewById<ViewGroup>(android.R.id.content)
    
    // Find the WebView initialized by Tauri
    rootView.post {
      val webView = findWebView(rootView)
      webView?.let { attachCustomWebChromeClient(it) }
    }
  }

  private fun findWebView(viewGroup: ViewGroup): WebView? {
    for (i in 0 until viewGroup.childCount) {
      val child = viewGroup.getChildAt(i)
      if (child is WebView) return child
      if (child is ViewGroup) {
        val found = findWebView(child)
        if (found != null) return found
      }
    }
    return null
  }

  private fun attachCustomWebChromeClient(webView: WebView) {
    val decorView = window.decorView as ViewGroup

    webView.webChromeClient = object : WebChromeClient() {
      override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        if (customView != null) {
          callback?.onCustomViewHidden()
          return
        }

        customView = view
        customViewCallback = callback

        fullscreenContainer = FrameLayout(this@MainActivity).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          addView(view)
        }

        decorView.addView(fullscreenContainer)
        webView.visibility = View.GONE
      }

      override fun onHideCustomView() {
        if (customView == null) return

        webView.visibility = View.VISIBLE
        fullscreenContainer?.let { decorView.removeView(it) }
        fullscreenContainer = null
        customView = null

        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
      }
    }
  }
}
