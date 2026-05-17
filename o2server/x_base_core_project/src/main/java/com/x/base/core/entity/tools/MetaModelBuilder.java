package com.x.base.core.entity.tools;

import java.io.File;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.stream.Collectors;

import jakarta.persistence.Entity;
import jakarta.persistence.MappedSuperclass;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.StandardLocation;
import javax.tools.ToolProvider;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.DirectoryFileFilter;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.lang3.RegExUtils;
import org.apache.commons.lang3.StringUtils;

import com.x.base.core.project.config.Config;

import io.github.classgraph.ClassGraph;
import io.github.classgraph.ClassInfo;
import io.github.classgraph.ClassInfoList;
import io.github.classgraph.ScanResult;

public class MetaModelBuilder {

	public static void main(String[] args) {
		try {

			File basedir = new File(args[0]);
			File sourcedir = new File(args[1]);
			File outputdir = new File(args[2]);

			JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
			StandardJavaFileManager fileManager = compiler.getStandardFileManager(null, null, StandardCharsets.UTF_8);
			fileManager.setLocation(StandardLocation.SOURCE_PATH, Arrays.asList(sourcedir));
			fileManager.setLocation(StandardLocation.CLASS_OUTPUT, Arrays.asList(sourcedir));
			fileManager.setLocation(StandardLocation.CLASS_PATH, classpath(outputdir));
			List<JavaFileObject> res = new ArrayList<>();

			List<String> paths = scanEntityJava(sourcedir);

			System.out.println("MetaModelBuilder: sourcedir=" + sourcedir.getAbsolutePath());
			System.out.println("MetaModelBuilder: found " + paths.size() + " entity source paths");
			for (String p : paths) {
				System.out.println("  entity path: " + p);
			}

			Iterable<? extends JavaFileObject> allSources = fileManager.list(StandardLocation.SOURCE_PATH, "", EnumSet.of(JavaFileObject.Kind.SOURCE), true);
			int sourceCount = 0;
			for (JavaFileObject o : allSources) {
				sourceCount++;
				if (paths.contains(o.getName())) {
					res.add(o);
				}
			}
			System.out.println("MetaModelBuilder: fileManager found " + sourceCount + " source files");
			System.out.println("MetaModelBuilder: matched " + res.size() + " source files for compilation");

			List<File> cpFiles = classpath(outputdir);
			boolean hasOpenJpa = cpFiles.stream().anyMatch(f -> f.getName().contains("openjpa"));
			System.out.println("MetaModelBuilder: classpath has OpenJPA: " + hasOpenJpa);
			for (File f : cpFiles) {
				if (f.getName().contains("openjpa") || f.getName().contains("persistence")) {
					System.out.println("  relevant cp: " + f.getAbsolutePath() + " exists=" + f.exists());
				}
			}

			List<String> compilerOptions = new ArrayList<>();
			compilerOptions.add("-Aopenjpa.metamodel=true");
			compilerOptions.add("-Aopenjpa.log=TRACE");
			String processorPath = cpFiles.stream().map(File::getAbsolutePath).collect(Collectors.joining(File.pathSeparator));
			compilerOptions.add("-processorpath");
			compilerOptions.add(processorPath);
			compilerOptions.add("-processor");
			compilerOptions.add("org.apache.openjpa.persistence.meta.AnnotationProcessor6");

			compiler.getTask(new OutputStreamWriter(System.out), fileManager, null,
					compilerOptions, null, res).call();

			removeClassFile(basedir);

		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	private static List<File> classpath(File outputdir) {

		List<File> cp = new ArrayList<>();

		cp.add(outputdir);
		cp.add(new File(Config.class.getProtectionDomain().getCodeSource().getLocation().getFile()));

		ClassLoader cl = MetaModelBuilder.class.getClassLoader();

		if (cl instanceof URLClassLoader) {
			URL[] urls = ((URLClassLoader) cl).getURLs();
			for (URL url : urls) {
				cp.add(new File(url.getFile()));
			}
		} else {
			String classpath = System.getProperty("java.class.path");
			String pathSeparator = System.getProperty("path.separator");
			if (classpath != null) {
				for (String entry : classpath.split(pathSeparator)) {
					cp.add(new File(entry));
				}
			}
		}
		return cp;
	}

	private static void removeClassFile(File sourcedir) throws IOException {
		for (File o : FileUtils.listFiles(sourcedir, new WildcardFileFilter("*.class"),
				DirectoryFileFilter.DIRECTORY)) {
			Files.delete(o.toPath());
		}
	}

	private static List<String> scanEntityJava(File sourcedir) {
		List<String> list = new ArrayList<>();
		try (ScanResult sr = new ClassGraph().enableAnnotationInfo().disableJarScanning().scan()) {
			ClassInfoList infos = new ClassInfoList();
			for (ClassInfo info : sr.getClassesWithAnnotation(Entity.class.getName())) {
				infos.add(info);
			}
			for (ClassInfo info : sr.getClassesWithAnnotation(MappedSuperclass.class.getName())) {
				infos.add(info);
			}
			for (ClassInfo info : infos) {
				File file = new File(sourcedir,
						RegExUtils.replaceAll(info.getName(), "\\.", Matcher.quoteReplacement(File.separator))
								+ ".java");
//				File file = new File(sourcedir,
//						info.getName().replaceAll("\\.", Matcher.quoteReplacement(File.separator)) + ".java");
				list.add(file.getAbsolutePath());
			}
			return list.stream().sorted().collect(Collectors.toList());
		}
	}
}