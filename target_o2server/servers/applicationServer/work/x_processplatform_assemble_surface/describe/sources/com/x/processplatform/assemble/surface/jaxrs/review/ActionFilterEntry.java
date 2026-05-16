package com.x.processplatform.assemble.surface.jaxrs.review;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.bean.NameValueCountPair;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.Review;
import com.x.processplatform.core.entity.content.Review_;
import com.x.processplatform.core.entity.element.Application;
import com.x.processplatform.core.entity.element.Process;

class ActionFilterEntry extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionFilterEntry.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson) throws Exception {
		LOGGER.debug("execute:{} ActionFilterEntry.", effectivePerson::getDistinguishedName);
		ActionResult<Wo> result = new ActionResult<>();
		Wo wo = get(effectivePerson);
		result.setData(wo);
		return result;
	}

	private Wo get(EffectivePerson effectivePerson) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			Wo wo = new Wo();
			return wo;
		}
	}

	public static class Wo {

		@FieldDescribe("可选择的应用")
		private List<NameValueCountPair> applicationList = new ArrayList<>();

		@FieldDescribe("可选择的流程")
		private List<NameValueCountPair> processList = new ArrayList<>();

		@FieldDescribe("可选择的组织")
		private List<NameValueCountPair> creatorUnitList = new ArrayList<>();

		@FieldDescribe("可选择的开始月份")
		private List<NameValueCountPair> startTimeMonthList = new ArrayList<>();

		public List<NameValueCountPair> getApplicationList() {
			return applicationList;
		}

		public void setApplicationList(
				List<NameValueCountPair> applicationList) {
			this.applicationList = applicationList;
		}

		public List<NameValueCountPair> getProcessList() {
			return processList;
		}

		public void setProcessList(List<NameValueCountPair> processList) {
			this.processList = processList;
		}

		public List<NameValueCountPair> getCreatorUnitList() {
			return creatorUnitList;
		}

		public void setCreatorUnitList(
				List<NameValueCountPair> creatorUnitList) {
			this.creatorUnitList = creatorUnitList;
		}

		public List<NameValueCountPair> getStartTimeMonthList() {
			return startTimeMonthList;
		}

		public void setStartTimeMonthList(
				List<NameValueCountPair> startTimeMonthList) {
			this.startTimeMonthList = startTimeMonthList;
		}
	}

	private List<NameValueCountPair> listApplication(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Review.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Review> root = cq.from(Review.class);
		Predicate p = cb.equal(root.get(Review_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Review_.application)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			try {
				Application application = business.application().pick(o);
				if (null != application) {
					pair.setValue(application.getId());
					pair.setName(application.getName());
				} else {
					pair.setValue(o);
					pair.setName(o);
				}
			} catch (Exception e) {
				LOGGER.error(e);
			}
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listProcess(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Review.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Review> root = cq.from(Review.class);
		Predicate p = cb.equal(root.get(Review_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Review_.process)).distinct(true).where(p))
				.getResultList();
		final Map<String, NameValueCountPair> map = new HashMap<>();
		os.stream().filter(StringUtils::isNotEmpty).forEach(o -> {
			try {
				Process process = business.process().pick(o);
				if (null != process) {
					String key = StringUtils.isBlank(process.getEdition()) ? process.getId() : process.getEdition();
					if (!map.containsKey(key)) {
						NameValueCountPair pair = new NameValueCountPair();
						pair.setValue(process.getId());
						pair.setName(process.getName());
						map.put(key, pair);
					}
				}
			} catch (Exception e) {
				LOGGER.error(e);
			}
		});
		return map.values().stream().sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listCreatorUnit(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Review.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Review> root = cq.from(Review.class);
		Predicate p = cb.equal(root.get(Review_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Review_.creatorUnit)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(StringUtils.defaultString(StringUtils.substringBefore(o, "@"), o));
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listStartTimeMonth(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Review.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Review> root = cq.from(Review.class);
		Predicate p = cb.equal(root.get(Review_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Review_.startTimeMonth)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(o);
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}
}
